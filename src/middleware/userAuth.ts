import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';


export interface RequestAuth extends Request {
    userId?: string;
    role?: 'User' | 'Admin';
    tokenVersion?: number;
}


export const userAuth = async (req: RequestAuth, res: Response, next: NextFunction) => {
    try{
        const header = req.headers.authorization;

    if(!header || !header.startsWith('Bearer ')){
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    const token = header.split(' ')[1];

    if(!token){
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }   

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as {
        userId: string, 
        role: 'User' | 'Admin', 
        tokenVersion: number
    };

    const user = await User.findById(decoded.userId);

    if(!user){
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    if(user.tokenVersion !== decoded.tokenVersion){
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    req.userId = decoded.userId;
    req.role = decoded.role;
    req.tokenVersion = decoded.tokenVersion;

    next();
    
    } catch(error){
        console.error(error);
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }
}