import { Request, Response } from "express";
import { RequestAuth } from "../../middleware/userAuth.js";
import Job from "../../models/job.model.js";
import User, { IUser } from "../../models/user.model.js";
import Category from "../../models/category.model.js";
import { createJobSchema, updateJopbSchema } from "./jobSchema.js";
import uploadToCloudinary from "../../services/imageUpload.service.js";
import { deleteFromLocal } from "../../utils/deleteFile.js";
import cloudinary from "../../config/cloudinary.js";
import mongoose from "mongoose";
import { ICategory } from "../../models/category.model.js";
import Saved from "../../models/saved.model.js";
import Application from "../../models/jobApplication.model.js";

//Escape regex special characters
const escapeRegex = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Allowed sort options: ?sort=newest | oldest | title | closing
// NOTE: "closing" assumes your Job model has a `closingDate` field.
// Rename it to match your schema, or remove that line.
const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  title: { title: 1 },
  closing: { closingDate: 1 },
};

//Create job
export const createJob = async (req: RequestAuth, res: Response) => {
  const result = createJobSchema.safeParse(req.body);

  const file = req.file;

  let uploadResult: { url: string; publicId: string } | undefined;

  try {
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid job data",
        error: result.error.flatten(),
      });
    }

    if (!file) {
      return res.status(400).json({
        message: "Logo file is required",
      });
    }

    const {
      title,
      description,
      company,
      location,
      skills,
      responsibilities,
      salaryMin,
      salaryMax,
      status,
      experienceLevel,
      category,
      jobType,
      workplace,
    } = result.data;

    //Check if the provided category exists in the db
    const existingCategory = await Category.findById(category);

    if (!existingCategory) {
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    //
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    uploadResult = await uploadToCloudinary(file.path, { folder: "jobs" });

    const newJob = await Job.create({
      title,
      description,
      company,
      location,
      skills,
      responsibilities,
      logo: uploadResult.url,
      publicId: uploadResult.publicId,
      salaryMin,
      salaryMax,
      status,
      experienceLevel,
      category,
      jobType,
      workplace,
      postedBy: user.id,
    });

    return res.status(201).json({
      message: "Job created successfully",
      job: {
        id: newJob._id,
        title: newJob.title,
        description: newJob.description,
        company: newJob.company,
        location: newJob.location,
        skills: newJob.skills,
        responsibilities: newJob.responsibilities,
        logo: newJob.logo,
        publicId: newJob.publicId,
        salaryMin: newJob.salaryMin,
        salaryMax: newJob.salaryMax,
        status: newJob.status,
        experienceLevel: newJob.experienceLevel,
        category: newJob.category,
        jobType: newJob.jobType,
        workplace: newJob.workplace,
        postedBy: newJob.postedBy,
      },
    });
  } catch (error) {
    if (uploadResult?.publicId) {
      await cloudinary.uploader.destroy(uploadResult.publicId).catch((err) => {
        console.error(`Failed to delete image from Cloudinary`, err);
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "internal server error",
    });
  } finally {
    if (file) {
      await deleteFromLocal(file.path).catch((error) =>
        console.error("Failed to delete logo image from local disk", error),
      );
    }
  }
};

//Get all job postings
export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const { category, experience, salary, workplace, search, location, sort } =
      req.query;

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    const conditions: Record<string, unknown>[] = [];

    if (typeof category === "string" && mongoose.isValidObjectId(category)) {
      filter.category = category;
    }

    if (typeof experience === "string" && experience) {
      filter.experienceLevel = experience;
    }

    if (typeof workplace === "string" && workplace) {
      filter.workplace = workplace;
    }

    if (salary) {
      const [min, max] = String(salary)
        .split("-")
        .map((value) => Number(value.replace("k", "000")));

      if (Number.isFinite(min) && Number.isFinite(max)) {
        filter.salaryMin = { $lte: max };
        filter.salaryMax = { $gte: min };
      }
    }

    // Search by title, company or skill
    if (typeof search === "string" && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      conditions.push({
        $or: [{ title: regex }, { company: regex }, { skills: regex }],
      });
    }

    // Location search ("remote" also matches the workplace field)
    if (typeof location === "string" && location.trim()) {
      const regex = new RegExp(escapeRegex(location.trim()), "i");
      conditions.push({
        $or: [{ location: regex }, { workplace: regex }],
      });
    }

    // $and keeps both $or groups instead of one overwriting the other
    if (conditions.length) {
      filter.$and = conditions;
    }

    //Create sort feature using date created, closing date and title
    const sortKey =
      typeof sort === "string" && SORT_OPTIONS[sort] ? sort : "newest";
    const sortBy = { ...SORT_OPTIONS[sortKey], _id: -1 as const };

    const jobs = await Job.find(filter)
      .populate("category")
      .populate<{ postedBy: IUser }>("postedBy", "firstName lastName")
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Job.countDocuments(filter);

    return res.status(200).json({
      jobs: jobs.map((job) => {
        return {
          job: {
            id: job._id,
            title: job.title,
            description: job.description,
            company: job.company,
            location: job.location,
            skills: job.skills,
            responsibilities: job.responsibilities,
            logo: job.logo,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            experienceLevel: job.experienceLevel,
            status: job.status,
            category: job.category,
            jobType: job.jobType,
            workplace: job.workplace,
            postedBy: `${job.postedBy.firstName} ${job.postedBy.lastName}`,
          },
        };
      }),
      paginate: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server",
    });
  }
};

//Get single job post
export const getJob = async (req: RequestAuth, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid job Id",
      });
    }

    const job = await Job.findById(id)
      .populate<{ category: ICategory }>("category")
      .populate<{ postedBy: IUser }>("postedBy", "firstName lastName");

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    return res.status(200).json({
      job: {
        id: job._id,
        title: job.title,
        desciption: job.description,
        company: job.company,
        location: job.location,
        skills: job.skills,
        responsibilities: job.responsibilities,
        logo: job.logo,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        experienceLevel: job.experienceLevel,
        status: job.status,
        category: job.category,
        jobType: job.jobType,
        workplace: job.workplace,
        postedBy: `${job.postedBy.firstName} ${job.postedBy.lastName}`,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "iInternal server error",
    });
  }
};

//Update job post
export const updateJob = async (req: RequestAuth, res: Response) => {
  const result = updateJopbSchema.safeParse(req.body);

  const file = req.file;

  const cleanupLocal = async () => {
    if (!file) return;
    await deleteFromLocal(file.path).catch((error) => {
      console.error("Unable to delete file from local disk", error);
    });
  };

  if (!result.success) {
    await cleanupLocal();
    return res.status(400).json({
      message: "Invalid data",
      error: result.error.flatten(),
    });
  }

  const updateData: Record<string, unknown> = { ...result.data };

  let logoResult: { url: string; publicId: string } | undefined;
  try {
    const id = req.params.id;

    if (!id || !mongoose.isValidObjectId(id)) {
      await cleanupLocal();
      return res.status(400).json({
        message: "Job Id is required",
      });
    }

    const job = await Job.findById(id);

    if (!job) {
      await cleanupLocal();
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (file) {
      logoResult = await uploadToCloudinary(file.path);

      updateData.logo = logoResult.url;
      updateData.publicId = logoResult.publicId;
    }

    const updatedJob = await Job.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedJob) {
      if (logoResult) {
        await cloudinary.uploader
          .destroy(logoResult.publicId)
          .catch((error) => {
            console.error("Failed to updated logo from cloudinary", error);
          });
      }

      await cleanupLocal();

      return res.status(404).json({
        message: "Job not found",
      });
    }

    //Delete fromlocal disk
    await cleanupLocal().catch((error) => {
      console.log("Unable to delete logo from local disk", error);
    });

    //Delete old logo from cloudinary
    if (logoResult && job.publicId) {
      await cloudinary.uploader.destroy(job.publicId).catch((error) => {
        console.error("Failed to delete old logo from cloudinary");
      });
    }

    return res.status(200).json({
      message: "Job updated successfully",
      job: {
        id: updatedJob?.id,
        title: updatedJob?.title,
        description: updatedJob?.description,
        company: updatedJob?.company,
        location: updatedJob?.location,
        skills: updatedJob?.skills,
        responsibilities: updatedJob?.responsibilities,
        logo: updatedJob?.logo,
        salaryMin: updatedJob?.salaryMin,
        salaryMax: updatedJob?.salaryMax,
        experienceLevel: updatedJob?.experienceLevel,
        status: updatedJob?.status,
        category: updatedJob?.category,
        jobType: updatedJob?.jobType,
        workplace: updatedJob?.workplace,
        postedBy: updatedJob?.postedBy,
      },
    });
  } catch (error) {
    await cleanupLocal();

    if (logoResult?.publicId) {
      await cloudinary.uploader.destroy(logoResult.publicId).catch((error) => {
        console.error(`Failed to delete updated logo from Cloudinary`, error);
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Delete job posting
export const deleteJob = async (req: RequestAuth, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Missing or invalid Id",
      });
    }

    const job = await Job.findByIdAndDelete(id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    const applications = await Application.find({ jobId: id }).select(
      "resumePublicId, coverLetterPublicId",
    );

    //Delete associated job id from Saved jobs and Applied jobs
    await Promise.all([
      Saved.deleteMany({ jobId: id }),
      Application.deleteMany({ jobId: id }),
    ]);

    //Merge publicIds into one list
    const rawIds = applications.flatMap((application) =>
      [application.resumePublicId, application.coverLetterPublicId].filter(
        (publicId): publicId is string => Boolean(publicId),
      ),
    );

    //Clean up the files from cloudinary
    await Promise.all([
      ...rawIds.map((publicId) => {
        return cloudinary.uploader
          .destroy(publicId, { resource_type: "raw" })
          .catch((error) => {
            console.log(
              "Failed to delete job application files from cloudinary",
              error,
            );
          });
      }),
      job.publicId
        ? cloudinary.uploader.destroy(job.publicId).catch((error) => {
            console.log("Failed to delete logo image from cloudinary", error);
          })
        : Promise.resolve(),
    ]);

    return res.status(200).json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
