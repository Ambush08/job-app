import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../../models/user.model.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createRefreshToken, createAccessToken } from '../../utils/verifyToken.js';
import hashPassword from '../../utils/hashPassword.js';

dotenv.config();

const getClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if(!clientId || !clientSecret || !redirectUri) {
        throw new Error('Missing Google OAuth2 credentials in environment variables');
    }

    return new OAuth2Client(clientId, clientSecret, redirectUri);
}


export const startGoogleAuth = (req: Request, res: Response) => {
    try{
        const client = getClient();

        const state = crypto.randomBytes(16).toString('hex'); 

        res.cookie('oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 10 * 60 * 1000
        });

        const authUrl = client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: ['openid', 'profile', 'email'],
            state,
        });

        return res.redirect(authUrl);

    }catch (error) {
        console.error('Error generating Google Auth URL:', error);
        return res.status(500).json({ 
            message: 'Failed to generate Google Auth URL' 
        });
    }
}


export const handleGoogleCallback = async (req: Request, res: Response) => {
    try {
        const { code, state } = req.query;

        if(!code || typeof code !== 'string') {
            return res.status(400).json({
                message: 'Missing or invalid code in google callback request'
            });
        }

        if(!state || typeof state !== 'string') {
            return res.status(400).json({
                message: 'Missing or invalid state in google callback request'
            });
        }

        const storedState = req.cookies?.oauth_state;

        if(!storedState || storedState !== state) {
            return res.status(400).json({
                message: 'Invalid state parameter in google callback request'
            });
        }

        res.clearCookie('oauth_state', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        const client = getClient();

        const { tokens} = await client.getToken(code);

        if(!tokens.id_token) {
            return res.status(400).json({
                message: 'Invalid or missing ID token from Google'
            });
        }

        //Verify the ID token and extract user information
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if(!payload || !payload.email) {
            return res.status(400).json({
                message: 'Failed to retrieve user information from Google'
            });
        }

        const email = payload.email;
        const nameParts = payload.name ? payload.name.split(' ') : [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const emailVerified = payload.email_verified || false;

        //Check if user already exists in the database
        let user  = await User.findOne({ email });

        const randomPassword = crypto.randomBytes(16).toString('hex'); 

        const passwordHash= await hashPassword(randomPassword); 

        if(!user){
            //Create a new user if not found
            user = await User.create({
                email,
                firstName,
                lastName,
                passwordHash,
                emailVerified,
                role: 'User',
            });
        } else {
            if(!user.emailVerified && emailVerified) {
                user.emailVerified = true;
                await user.save();
            }
        }

        //Generate a JWT token for the user
        const refreshToken = createRefreshToken(user.id, user.role, user.tokenVersion);

        const isProd = process.env.NODE_ENV === 'production';

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const accessToken = createAccessToken(user.id, user.role, user.tokenVersion);

        return res.status(200).json({
            message: 'User authenticated successfully',
            user:{
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                emailVerified: user.emailVerified,
                role: user.role
            },
            accessToken
        });


    } catch (error) {
        console.error('Error handling Google callback:', error);
        return res.status(500).json({ 
            message: 'Internal server error while handling Google callback' 
        });
    }
}