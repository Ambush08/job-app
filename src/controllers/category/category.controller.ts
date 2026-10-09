import { Request, Response } from "express";
import { RequestAuth } from "../../middleware/userAuth.js";
import Category, { ICategory } from "../../models/category.model.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./categorySchema.js";
import slugify from "slugify";
import Job from "../../models/job.model.js";
import mongoose from "mongoose";

//Create categories
export const createCategory = async (req: RequestAuth, res: Response) => {
  const result = createCategorySchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid category name",
      error: result.error.flatten(),
    });
  }

  const { name } = result.data;
  try {
    const category = await Category.findOne({ name });

    if (category) {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    const slug = slugify(name, { lower: true, strict: true });

    const newCategory = await Category.create({
      name,
      slug,
    });

    return res.status(201).json({
      message: "Category created successfully",
      category: {
        id: newCategory.id,
        name: newCategory.name,
        slug: newCategory.slug,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Get all categories
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();

    if (categories.length === 0) {
      return res.status(200).json({
        message: "No category found",
      });
    }

    return res.status(200).json({
      categories: categories.map((category) => {
        return {
          id: category._id,
          name: category.name,
          slug: category.slug,
        };
      }),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Update category
export const updateCategory = async (req: RequestAuth, res: Response) => {
  const result = updateCategorySchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid category name",
      error: result.error.flatten(),
    });
  }

  const { name } = result.data;
  try {
    const { id } = req.params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid job id",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        message: `Category with id ${id} not found. Invalid Id`,
      });
    }

    const updatedSlug = slugify(name, { lower: true, strict: true });

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name,
        slug: updatedSlug,
      },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      message: "Category updated successfully",
      category: {
        id: updatedCategory?.id,
        name: updatedCategory?.name,
        slug: updatedCategory?.slug,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Delete category
export const deleteCategory = async (req: RequestAuth, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid job id",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        message: `Category with id ${id} not found`,
      });
    }

    const existingJobs = await Job.countDocuments({ category: category.id });

    if (existingJobs > 0) {
      return res.status(409).json({
        message: "Cannot delete category because it contains existing jobs",
      });
    }

    const deleteCategory = await Category.findByIdAndDelete(id);

    return res.status(200).json({
      Message: "Category deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
