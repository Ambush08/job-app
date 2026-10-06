import dns from 'dns';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import userRouter from './routes/user.routes.js'

dotenv.config();

dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

//setup cors and cookieparser 
app.use(cors());
app.use(cookieParser());
app.use(express.json());

//connect database
await connectDB();

app.use('/user/auth', userRouter)

const port  = Number(process.env.PORT) || 4000;

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})