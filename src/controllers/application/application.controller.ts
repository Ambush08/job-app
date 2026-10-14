import { Response } from "express";
import { RequestAuth } from "../../middleware/userAuth.js";
import Job from "../../models/job.model.js";
import Application, { ApplicationStatus } from "../../models/jobApplication.model.js";
import mongoose from "mongoose";
import uploadToCloudinary from "../../services/imageUpload.service.js";
import cloudinary from "../../config/cloudinary.js";
import deleteFromLocal from "../../utils/deleteFile.js";
import User from "../../models/user.model.js";

//Apply job
export const applyJob = async (req: RequestAuth, res: Response) => {
  const files = req.files as
    | { [field: string]: Express.Multer.File[] }
    | undefined;

  const uploadedIds: string[] = [];

  try {
    const userId = req.userId;

    const { jobId } = req.params as { jobId: string };

    const resume = files?.resume?.[0];

    const coverLetter = files?.coverLetter?.[0];

    if (!jobId || !mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({
        message: "Invalid or mising job Id",
      });
    }

    if (!resume) {
      return res.status(400).json({
        message: "Resume is required",
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (job.status !== "Open") {
      return res.status(400).json({
        message: "This job is no longer accepting applications",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role === "Admin") {
      return res.status(403).json({
        message: "Admins cannot apply for jobs",
      });
    }

    const isApplied = await Application.exists({ jobId, applicantId: userId });

    if (isApplied) {
      return res.status(409).json({
        message: "Already applied for this position",
      });
    }

    //Upload resume to cloudinary
    const resumeResult = await uploadToCloudinary(resume.path, {
      folder: "resumes",
      resource_type: "raw",
      use_filename: true,
    });

    //Push resume publid_id to uploadIds array
    uploadedIds.push(resumeResult.publicId);

    //Upload cover letter to cloudinary
    let coverResult: { url: string; publicId: string } | undefined;

    if (coverLetter) {
      coverResult = await uploadToCloudinary(coverLetter.path, {
        folder: "cover-letters",
        resource_type: "raw",
        use_filename: true,
      });

      //Push cover result id to uploadIds array
      uploadedIds.push(coverResult.publicId);
    }

    await Application.create({
      applicantId: userId,
      jobId,
      resumeUrl: resumeResult.url,
      resumePublicId: resumeResult.publicId,
      coverLetterUrl: coverResult?.url,
      coverLetterPublicId: coverResult?.publicId,
    });

    return res.status(201).json({
      message: "Application submitted successfully",
    });
  } catch (error: any) {
    //Delete files from cloudinary
    await Promise.all(
      uploadedIds.map((id) =>
        cloudinary.uploader
          .destroy(id, { resource_type: "raw" })
          .catch((error) => {
            console.error(
              `Failed to delete job application file wi id ${id} from cloudinary`,
              error,
            );
          }),
      ),
    );

    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already applied for this role",
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  } finally {
    const localFiles = files ? Object.values(files).flat() : [];
    await Promise.all(
      localFiles.map((file) =>
        deleteFromLocal(file.path).catch((error) => {
          console.error(
            "Failed to delete job application files from local disk",
            error,
          );
        }),
      ),
    );
  }
};

//My job applications
export const getMyJobApplications = async (req: RequestAuth, res: Response) => {
  try {
    const userId = req.userId;

    const applications = await Application.find({ applicantId: userId })
      .select("-resumePublicId -coverLetterPublicId")
      .populate("jobId", "title company location logo jobType status")
      .sort({ createdAt: -1 })
      .lean();

    if (applications.length === 0) {
      return res.status(200).json({
        message: "You have not made any job application",
      });
    }

    return res.status(200).json({
      applications,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Get all job applications
export const getAllJobApplications = async (
  req: RequestAuth,
  res: Response,
) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      Application.find()
        .populate("applicantId", "firstName lastName email")
        .populate("jobId", "title")
        .select("-resumePublicId -coverLetterPublicId")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Application.countDocuments(),
    ]);

    return res.status(200).json({
      applications,
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


//Update job application status 
export const updateApplicationStatus = async (req: RequestAuth, res: Response) => {
  const validApplicationStatus = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];
  try {
    const { id } = req.params;

    const status = req.body.status;

    if(!status){
      return res.status(400).json({
        message: "Application status is required"
      });
    }

    if(!id || !mongoose.isValidObjectId(id)){
      return res.status(400).json({
        message: "Invalid or missing application Id"
      });
    }

    if(typeof status !== 'string' || !validApplicationStatus.includes(status)){
      return res.status(404).json({
        message: "Provide a valid application status"
      })
    }

    const application = await Application.findById(id).select("-resumePublicId -coverLetterPublicId");

    if(!application){
      return res.status(404).json({
        message: "Application not found"
      });
    }

    application.status = status as ApplicationStatus;

    await application.save();

    return res.status(200).json({
      message: "Application status updated successfully",
      application: {
        id: application.id,
        applicantId: application.applicantId,
        jobId: application.jobId,
        status: application.status,
        resumeUrl: application.resumeUrl,
        coverLetterUrl: application.coverLetterUrl
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}
