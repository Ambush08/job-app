import dns from 'dns';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import userRouter from './routes/user.routes.js';
import jobRouter from './routes/job.routes.js';
import categoryRouter from './routes/category.routes.js'

dotenv.config();

dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

//setup cors and cookieparser 
app.use(cors());
app.use(cookieParser());
app.use(express.json());

//connect database
await connectDB();

//User route
app.use('/user/auth', userRouter);

//Job route
app.use('/api/v1/jobs', jobRouter);

//Category route
app.use('/api/v1/categories', categoryRouter)

const port  = Number(process.env.PORT) || 4000;

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})