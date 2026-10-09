import z from "zod";

const jsonArray = z.preprocess(
  (v) => {
    if (typeof v !== "string") return v;
    try {
      return JSON.parse(v);
    } catch {
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  },
  z.array(z.string().trim().min(1)).min(1),
);

export const createJobSchema = z
  .object({
    title: z.string().trim().min(1, { message: "Title is required" }),
    description: z
      .string()
      .trim()
      .min(1, { message: "Description is required" }),
    company: z.string().trim().min(1, { message: "Company is required" }),
    location: z.string().trim().min(1, { message: "Location is required" }),
    skills: jsonArray,
    responsibilities: jsonArray,
    salaryMin: z.coerce.number().positive(),
    salaryMax: z.coerce.number().positive(),
    status: z.enum(["Open", "Closed"]).optional(),
    experienceLevel: z.enum(["Entry", "Mid", "Senior"]),
    category: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid category id" }),
    jobType: z.enum(["Full-time", "Part-time", "Contract", "Internship"]),
    workplace: z.enum(["Remote", "On-site", "Hybrid"]),
  })
  .refine((data) => data.salaryMax >= data.salaryMin, {
    message: "salaryMax must be greater than or equal to salaryMin",
    path: ["salaryMax"],
  });

export const updateJopbSchema = z
  .object({
    title: z.string().trim().min(1, { message: "Title is required" }),
    description: z
      .string()
      .trim()
      .min(1, { message: "Description is required" }),
    company: z.string().trim().min(1, { message: "Company is required" }),
    location: z.string().trim().min(1, { message: "Location is required" }),
    skills: jsonArray,
    responsibilities: jsonArray,
    salaryMin: z.coerce.number().positive(),
    salaryMax: z.coerce.number().positive(),
    status: z.enum(["Open", "Closed"]).optional(),
    experienceLevel: z.enum(["Entry", "Mid", "Senior"]),
    category: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid category id" }),
    jobType: z.enum(["Full-time", "Part-time", "Contract", "Internship"]),
    workplace: z.enum(["Remote", "On-site", "Hybrid"]),
  })
  .refine((data) => data.salaryMax >= data.salaryMin, {
    message: "SalaryMax must be greater or equal to salaryMin",
    path: ["salaryMax"],
  });
