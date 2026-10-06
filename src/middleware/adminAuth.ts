import { Response, NextFunction} from 'express';
import {RequestAuth} from './userAuth.js';

export const adminAuth = (req: RequestAuth, res: Response, next: NextFunction) => {
    //Check user role
    if(req.role !== 'Admin'){
        return res.status(403).json({
            message: 'Forbidden'
        });
    }
    next();
}

