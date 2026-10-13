import { Router } from "express";

const router = Router();

import { createJob, deleteJob, getAllJobs, getJob, updateJob } from "../controllers/job/job.controller.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { userAuth } from "../middleware/userAuth.js";
import upload, { uploadDocs } from "../middleware/multer.js";
import { getSavedJobs, saveJob, unsaveJob } from "../controllers/saved/saved.controller.js";
import { applyJob } from "../controllers/application/application.controller.js";


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

//Save job
router.post('/savedJobs/:jobId/save', userAuth, saveJob);

//Get saved jobs
router.get('/savedJobs', userAuth, getSavedJobs);

//Delete saved job
router.delete('/savedJobs/:jobId/delete', userAuth, unsaveJob);


//Apply job 
router.post('/applications/:jobId/apply', userAuth, uploadDocs.fields([
    {name: 'resume', maxCount: 1},
    {name: 'coverLettr', maxCount: 1}
]), applyJob);


//View applications 

export default router;