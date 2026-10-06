import { Response} from 'express';
import User from '../../models/user.model.js';
import {generateSecret, verify, generateURI} from 'otplib';
import { RequestAuth } from '../../middleware/userAuth.js';


export const setup2FA = async (req: RequestAuth, res: Response) => {
    try{
        const user  = await User.findById(req.userId);

        if(!user){
            return res.status(404).json({
                message: 'User not found'
            });
        }

        if(user.twoFactorEnabled){
            return res.status(400).json({
                message: '2FA is already enabled for this user. Disable it first to setup a new one.'
            });
        }

        const secret = generateSecret();

        user.twoFactorSecret = secret;

        await user.save();

        const issuer = 'Job App';

        const otpauthUrl = generateURI({
            label:user.email, 
            secret, 
            issuer
        });

        return res.status(200).json({
            message: '2FA setup successful',
            otpauthUrl
        });
    }catch (error) {
        console.error('Error setting up 2FA:', error);
        return res.status(500).json({
            message: 'Failed to set up 2FA'
        });
    }
}

export const verify2FA = async (req: RequestAuth, res: Response) => {
    try{
        const { code } = req.body;

        if(!code || typeof code !== 'string'){
            return res.status(400).json({
                message: '2FA code is required'
            });
        }

        const user =  await User.findById(req.userId);

        if(!user){
            return res.status(404).json({
                message: 'User not found'
            });
        }

        if(!user.twoFactorSecret){
            return res.status(400).json({
                message: 'Setup 2FA first before verifying'
            });
        }

        const result = await verify({ token: code, secret: user.twoFactorSecret });

        if(!result.valid){
            return res.status(400).json({
                message: 'Invalid 2FA code'
            });
        }

        user.twoFactorEnabled = true;
        await user.save();

        return res.status(200).json({
            message: '2FA verified and enabled successfully'
        });

    }catch(error){
        console.error('Error verifying 2FA:', error);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
}