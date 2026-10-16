import Blog from "../../models/blog.model.js";
import { RequestAuth } from "../../middleware/userAuth.js";
import { Request, Response } from "express";
import { createBlogSchema, updateBlogSchema } from "./blog.schema.js";
import deleteFromLocal from "../../utils/deleteFile.js";
import uploadToCloudinary from "../../services/imageUpload.service.js";
import cloudinary from "../../config/cloudinary.js";
import { IUser } from "../../models/user.model.js";
import mongoose from "mongoose";

//Create blog
export const createBlog = async (req: RequestAuth, res: Response) => {
  const result = createBlogSchema.safeParse(req.body);

  const file = req.file;

  let coverResult: { url: string; publicId: string } | undefined;

  try {
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid data",
        error: result.error.flatten(),
      });
    }

    if (!file) {
      return res.status(400).json({
        message: "Blog cover image is required",
      });
    }

    const { title, snippet, body, category } = result.data;

    const validCategory = [
      "tech",
      "business",
      "fashion",
      "politics",
      "engineering",
      "sports",
    ];

    const userId = req.userId;

    if (!validCategory.includes(category)) {
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    coverResult = await uploadToCloudinary(file.path, {
      folder: "blogs",
    });

    const newBlog = await Blog.create({
      title,
      snippet,
      body,
      category,
      postedBy: userId,
      coverImageUrl: coverResult.url,
      coverImagePublicId: coverResult.publicId,
    });

    return res.status(201).json({
      message: "Blog created successfuly",
      blog: {
        id: newBlog.id,
        title: newBlog.title,
        snippet: newBlog.snippet,
        body: newBlog.body,
        coverImageUrl: newBlog.coverImageUrl,
        coverImagePubicId: newBlog.coverImagePublicId,
        postedBy: newBlog.postedBy,
      },
    });
  } catch (error) {
    if (coverResult && coverResult.publicId) {
      await cloudinary.uploader.destroy(coverResult.publicId).catch((error) => {
        console.error(
          "Failed to delete blog cover image from cloudinary",
          error,
        );
      });
    }
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  } finally {
    if (file) {
      await deleteFromLocal(file.path).catch((error) =>
        console.error(
          "Failed to delete blog cover image from local disk",
          error,
        ),
      );
    }
  }
};

//Read all blogs
export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find()
        .populate<{ postedBy: IUser }>("postedBy", "firstName lastName")
        .select("-coverImagePublicId")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Blog.countDocuments(),
    ]);

    return res.status(200).json({
      blogs: blogs.map((blog) => {
        return {
          id: blog._id,
          title: blog.title,
          snippet: blog.snippet,
          body: blog.body,
          coverImageUrl: blog.coverImageUrl,
          postedBy: `${blog.postedBy.firstName} ${blog.postedBy.lastName}`,
        };
      }),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Read single blog
export const getBlog = async (req: RequestAuth, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid or missing blog Id",
      });
    }

    //Find blog
    const blog = await Blog.findById(id)
      .populate<{ postedBy: IUser }>("postedBy", "firstName lastName")
      .select("-coverImagePublicId");

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      blog: {
        id: blog.id,
        title: blog.title,
        snippet: blog.title,
        body: blog.body,
        coverImageUrl: blog.coverImageUrl,
        postedBy: `${blog.postedBy.firstName} ${blog.postedBy.lastName}`,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//Update blog
export const updateBlog = async (req: RequestAuth, res: Response) => {
  const result = updateBlogSchema.safeParse(req.body);

  let newCoverResult: { url: string; publicId: string } | undefined;

  const file = req.file;

  try {
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid data",
        error: result.error.flatten(),
      });
    }

    const { title, snippet, body, category } = result.data;

    const { id } = req.params;

    const validCategory = [
      "tech",
      "business",
      "fashion",
      "politics",
      "engineering",
      "sports",
    ];

    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid or missing id",
      });
    }

    if (!validCategory.includes(category)) {
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    const oldPublicId = blog.coverImagePublicId;

    if (file) {
      newCoverResult = await uploadToCloudinary(file?.path, {
        folder: "blogs",
      });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        title,
        snippet,
        body,
        category,
        coverImageUrl: newCoverResult?.url,
        coverImagePublicId: newCoverResult?.publicId,
      },
      { new: true, runValidators: true },
    );

    if (!updatedBlog) {
      if (newCoverResult && newCoverResult.publicId) {
        await cloudinary.uploader
          .destroy(newCoverResult.publicId)
          .catch((error) => {
            console.error(
              "Failed to delete new cover image from cloudinary",
              error,
            );
          });
      }

      return res.status(404).json({
        message: "Blog not found",
      });
    }

    //Delete old cover image from cloudinary
    if (newCoverResult && oldPublicId) {
      await cloudinary.uploader.destroy(oldPublicId).catch((error) => {
        console.error(
          "Failed to delete old cover image from cloudinary",
          error,
        );
      });
    }

    return res.status(200).json({
      message: "Blog updated successfully",
      blog: {
        id: updatedBlog?.id,
        title: updatedBlog?.title,
        snippet: updatedBlog?.snippet,
        category: updatedBlog?.category,
        coverImageUrl: updatedBlog?.coverImageUrl,
        coverImagePublicId: updatedBlog?.coverImagePublicId,
        postedBy: updatedBlog?.postedBy,
      },
    });
  } catch (error) {
    if (newCoverResult) {
      await cloudinary.uploader
        .destroy(newCoverResult.publicId)
        .catch((error) => {
          console.error(
            "Failed to delete new cover image from cloudinary",
            error,
          );
        });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  } finally {
    if (file) {
      await deleteFromLocal(file.path)
      .catch((error) => {
        console.error("Failed to delete new cover image from local disk", error)
      });
    }
  }
};

//Delete blog
export const deleteBlog = async (req: RequestAuth, res: Response) => {
  try {
    const id = req.params.id;

    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid or missing blog Id",
      });
    }

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    const publicId = blog?.coverImagePublicId;

    if (publicId) {
      await cloudinary
      .uploader
      .destroy(publicId)
      .catch((error) => {
        console.error("Failed to delete cover image from cloudinary", error);
      });
    }

    return res.status(200).json({
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
