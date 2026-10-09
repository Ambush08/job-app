import { Router } from "express";

const router = Router();

import { createJob, deleteJob, getAllJobs, getJob, updateJob } from "../controllers/job/job.controller.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { userAuth } from "../middleware/userAuth.js";
import upload from "../middleware/multer.js";


//Create job
router.post("/create", userAuth, adminAuth, upload.single("logo"), createJob);

//Get all jobs 
router.get('/', getAllJobs);

//Get a job post
router.get('/job/:id', userAuth, getJob);

//Update job post 
router.patch('/update/:id', userAuth, adminAuth, upload.single('logo'), updateJob);

//Delete job
router.delete('/delete/:id', userAuth, adminAuth, deleteJob);

export default router;