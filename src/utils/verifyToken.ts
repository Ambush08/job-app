import jwt from 'jsonwebtoken';

export const verifyEmailToken = (token: string) => {
    const secret = process.env.JWT_ACCESS_SECRET as string;

    return jwt.verify(token, secret)
}

export const createRefreshToken = (userId: string, role: 'User' | 'Admin', tokenVersion: number) => {
    const refreshSecret = process.env.JWT_REFRESH_SECRET as string;

    return jwt.sign(
        {userId, role, tokenVersion},
        refreshSecret,
        {expiresIn: '7d'}
    );
}

export const createAccessToken = (userId: string, role: 'User' | 'Admin', tokenVersion: number) => {
    const secret = process.env.JWT_ACCESS_SECRET as string;

    return jwt.sign(
        {userId, role, tokenVersion},
        secret,
        {expiresIn: '30min'}
    );
}