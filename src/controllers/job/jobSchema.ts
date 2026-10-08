import z from "zod";
import mongoose from "mongoose";

export const createJobSchema = z
  .object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z
      .string()
      .trim()
      .min(1, { message: "Description is required" }),
    company: z.string().trim().min(1, { message: "Company is required" }),
    location: z.string().trim().min(1, { message: "Location is required" }),
    skills: z.array(
      z.string().trim().min(1, { message: "Skills cannot be empty" }),
    ),
    responsibilities: z.array(
      z.string().trim().min(1, { message: "Responsibilities cannot be empty" }),
    ),
    salaryMin: z.number().positive(),
    salaryMax: z.number().positive(),
    status: z.enum(["Open", "Closed"]).optional(),
    experienceLevel: z.enum(["Entry", "Mid", "Senior"]),
    category: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid category id",
    }),
    jobType: z.enum(["Full-time", "Part-time", "Contract", "Internship"]),
    workplace: z.enum(["Remote", "On-site", "Hybrid"]),
  })
  .refine((data) => data.salaryMax >= data.salaryMin, {
    message: "salaryMax must be greater than or equal to salaryMin",
    path: ["salaryMax"],
  });
