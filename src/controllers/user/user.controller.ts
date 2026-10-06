import { Request, Response } from "express";
import User from "../../models/user.model.js";
import { loginSchema, registerSchema } from "./userSchema.js";
import hashPassword from "../../utils/hashPassword.js";
import sendEmail from "../../config/sendEmail.js";
import jwt from "jsonwebtoken";
import { createAccessToken, createRefreshToken, verifyEmailToken } from "../../utils/verifyToken.js";
import bcrypt from 'bcrypt';
import crypto from 'crypto'

const getAppUrl = () => {
  const appUrl = process.env.APP_URI as string;

  return appUrl || `http://localhost:${process.env.PORT}`;
};

//Create user
export const registerUser = async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid data",
      error: result.error.flatten(),
    });
  }

  const { email, firstName, lastName, password } = result.data;
  try {
    const normalizedEmail = email.toLocaleLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    //Check if user already exists
    if (user) {
      return res.status(409).json({
        message: "User with email already exists. Login",
      });
    }

    //Hash password
    const passwordHash = await hashPassword(password);

    const newUser = await User.create({
      email: normalizedEmail,
      firstName,
      lastName,
      passwordHash,
    });

    const verifyEmailToken = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_ACCESS_SECRET as string,
      { expiresIn: "15min" },
    );

    const verifyEmailUrl = `${getAppUrl()}/user/auth/verify-email?token=${verifyEmailToken}`;

    //Send email verification link
    await sendEmail(
      newUser.email,
      "Verify Email",
      `
            <p>Click the link to verify your email</p>
            <p>
                <a href='${verifyEmailUrl}'>${verifyEmailUrl}</a>
            </p>
            `,
    );

    return res.status(201).json({
      message:
        "User created successfully. A link has been sent to your email, click it to verify your email.",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        emailVerified: newUser.emailVerified,
        twoFactorEnabled: newUser.twoFactorEnabled,
        accountType: newUser.accountType,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Verify user email
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({
        message: "Verification token missing",
      });
    }

    const decoded = verifyEmailToken(token) as { userId: string };

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.emailVerified = true;

    await user.save();

    return res.status(200).json({
      message: "Email verification successfull",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Login User
export const login = async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid data",
      error: result.error.flatten(),
    });
  }

  const { email, password } = result.data;
  try {
    const normalizedEmail = email.toLowerCase().trim();

    //Check if user exists
    const user = await User.findOne({email: normalizedEmail}).select('+passwordHash');

    if(!user){
        return res.status(404).json({
            message: "User not found"
        });
    }

    if(!user.emailVerified){
        return res.status(403).json({
            message: "Verify your email first"
        });  
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    //Check if password match
    if(!isMatch){
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    //Refresh token
    const refreshToken = createRefreshToken(user.id, user.role, user.tokenVersion);

    const isSecure = process.env.NODE_ENV === 'production';

    //Access token
    const accessToken  = createAccessToken(user.id, user.role, user.tokenVersion)

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecure
    });

    return res.status(200).json({
        message: "Login successful",
        user: {
            id: user.id,
            email: user
            .email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            profile: user.profile,
            emailVerified: user.emailVerified
        },
        accessToken
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Forgot password
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body as {email: string};

        if(!email){
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        //Find User 
        const user = await User.findOne({email: normalizedEmail});

        if(!user){
            return res.status(400).json({
                message: "If an account with this email exists, a link has been sent to your email."
            });
        }

        const token  = crypto.randomBytes(32).toString('hex');

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        user.passwordResetToken = tokenHash;

        user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

        await user.save();

        const resetPasswordUrl = `${getAppUrl()}/user/auth/reset-password?token=${token}`;

        await sendEmail(
            user.email,
            'Forgot password',
            `
            <p>Click the link below to reset your password</p>
            <p>
            <a href='${resetPasswordUrl}'>${resetPasswordUrl}</a>
            </p>
            `
        );

        return res.status(200).json({
            message: "If an account with this email exists, a link has been sent to your email."
        });

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

//Reset password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const {password, token} = req.body as {password: string, token: string};

        if(!password || password.length < 8){
            return res.status(400).json({
                message: "Password must be 8 characters"
            });
        }

        if(!token){
            return res.status(400).json({
                message: "Missing or invalid token"
            });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: tokenHash,
            passwordResetExpires: {$gt: Date.now()}
        }).select("+passwordHash");

        if(!user){
            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }

        const newPasswordHash = await hashPassword(password);

        user.passwordHash = newPasswordHash;

        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.tokenVersion = user.tokenVersion + 1;

        await user.save();

        return res.status(200).json({
            mssage: "Password reset successfully"
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

//Logout handler
export const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/'
        });

        return res.status(200).json({
            message: "Logout successful"
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

//Refresh token handler
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken as string | undefined;

        if(!refreshToken){
            return res.status(400).json({
                message: "Missing refresh token"
            });
        }

        const secret = process.env.JWT_REFRESH_SECRET as string;

        const decoded = jwt.verify(refreshToken, secret) as {userId: string, role: 'User' | 'Admin', tokenVersion: number};

        const user = await User.findById(decoded.userId);

        if(!user){
            return res.status(401).json({
                message: "Invalid or expired refresh token"
            });
        }

        if(user.tokenVersion !== decoded.tokenVersion){
            return res.status(401).json({
                message: "Invalid or expired refresh token"
            });
        }

        //Create new refresh token 
        const newRefreshToken = createRefreshToken(user.id, user.role, user.tokenVersion);

        const isProd = process.env.NODE_ENV as string === 'production';

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProd
        });

        //  Create new access token 
        const newAccessToken = createAccessToken(user.id, user.role, user.tokenVersion);

        return res.status(200).json({
            message: "New refresh token created successfully",
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                emailVerified: user.emailVerified,
                accountType: user.accountType
            },
            accessToken: newAccessToken
        });

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: "Internal server error"
        });        
    }
}
