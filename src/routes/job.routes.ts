import { Router } from "express";

const router = Router();

import { createJob } from "../controllers/job/job.controller.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { userAuth } from "../middleware/userAuth.js";
import upload from "../middleware/multer.js";

router.post("/createJob", userAuth, adminAuth, upload.single("logo"), createJob);

export default router;