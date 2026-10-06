import { Router } from "express";
import { login, registerUser, verifyEmail, forgotPassword, resetPassword, logout, refreshToken } from "../controllers/user/user.controller.js";
import { handleGoogleCallback, startGoogleAuth } from "../controllers/user/googleAuth.js";
import { setup2FA, verify2FA } from "../controllers/user/2Fa.controller.js";
import { userAuth } from "../middleware/userAuth.js";

const router = Router();

//Create user
router.post('/register', registerUser);

//Verify user email 
router.get('/verify-email', verifyEmail);

//Login user
router.post('/login', login);

//Forgot password
router.post('/forgot-password', forgotPassword);

//Reset password
router.post('/reset-password', resetPassword);

//Logout user
router.post('/logout', logout);

//Refresh token handler
router.post('/refresh-token', refreshToken);

//Google OAuth routes
router.get('/google', startGoogleAuth);

//Google OAuth callback route
router.get('/google/callback', handleGoogleCallback);

//setup 2FA
router.post('/2fa/setup', userAuth,setup2FA);

//verify 2FA
router.post('/2fa/verify', userAuth, verify2FA);


export default router;