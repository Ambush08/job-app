import Saved from "../../models/saved.model.js";
import Job from "../../models/job.model.js";
import { RequestAuth } from "../../middleware/userAuth.js";
import { Response } from "express";
import mongoose from "mongoose";

export const saveJob = async (req: RequestAuth, res: Response) => {
  try {
    const userId = req.userId;

    const { jobId } = req.params as { jobId: string };

    if (!jobId || !mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({
        message: "Invalid or missing job Id",
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    await Saved.create({ userId, jobId });

    return res.status(201).json({
      message: "Job saved successfully",
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Job already saved",
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getSavedJobs = async (req: RequestAuth, res: Response) => {
  try {
    const userId = req.userId;

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 50);

    const skip = (page - 1) * limit;

    const [savedJobs, total] = await Promise.all([
      Saved.find({ userId })
        .populate("jobId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Saved.countDocuments({ userId }),
    ]);

    const jobs = savedJobs.filter((saved) => {
      return saved.jobId !== null;
    });

    return res.status(200).json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const unsaveJob = async (req: RequestAuth, res: Response) => {
    try {
        const { jobId} = req.params as { jobId: string};

        const userId = req.userId;

        if(!jobId || !mongoose.isValidObjectId(jobId)){
            return res.status(400).json({
                message: "Missing or invalid job id"
            });
        }

        const unsaved = await Saved.findOneAndDelete({ userId, jobId});

        if(!unsaved){
            return res.status(404).json({
                message: "Saved job not found"
            });
        }

        return res.status(200).json({
            message: "Job removed from saved jobs list"
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
