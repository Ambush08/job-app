import { Request, Response } from "express";
import { RequestAuth } from "../../middleware/userAuth.js";
import Job from "../../models/job.model.js";
import User, { IUser } from "../../models/user.model.js";
import Category from "../../models/category.model.js";
import { createJobSchema } from "./jobSchema.js";
import uploadToCloudinary from "../../services/imageUpload.service.js";
import { deleteFromLocal } from "../../utils/deleteFile.js";
import cloudinary from "../../config/cloudinary.js";

//Create job
export const createJob = async (req: RequestAuth, res: Response) => {
  const result = createJobSchema.safeParse(req.body);

  const file = req.file;

  if (!result.success) {
    await deleteFromLocal(file?.path || "");

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

  let uploadResult: { url: string; publicId: string } | undefined;

  try {
    //Check if the provided category exists in the db
    const existingCategory = await Category.findById(category);

    if (!existingCategory) {
      await deleteFromLocal(file.path);
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    //
    const user = await User.findById(req.userId);

    if (!user) {
      await deleteFromLocal(file.path);

      return res.status(404).json({
        message: "User not found",
      });
    }

    uploadResult = await uploadToCloudinary(file.path);

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

    await deleteFromLocal(file.path);

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
    await deleteFromLocal(file.path);

    if (uploadResult?.publicId) {
      await cloudinary.uploader.destroy(uploadResult.publicId).catch((err) => {
        console.error(`Failed to delete image from Cloudinary`, err);
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "internal server error",
    });
  }
};

//Get all job postings
export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const { category, experience, salary, workplace, sort } = req.query;

    const page = Number(req.query.page || 1);

    const limit = Number(req.query.limit || 6);

    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (category) {
      filter.category = category;
    }

    if (experience) {
      filter.experienceLevel = experience;
    }

    if (workplace) {
      filter.workplace = workplace;
    }

    if (salary) {
      const [min, max] = String(salary)
        .split("-")
        .map((value) => Number(value.replace("k", "000")));

      filter.salaryMin = { $lte: min };
      filter.salaryMax = { $gte: max };
    }

    //const sorted: Record<string, 1 | -1> = {}

    const jobs = await Job.find(filter)
      .populate("category")
      .populate<{ postedBy: IUser }>("postedBy", "firstName lastName")
      .sort({ createdAt: -1, title: 1 })
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
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "iInternal server error"
        });
    }
}