import cloudinary from "../config/cloudinary.js";
import { UploadApiOptions } from "cloudinary";

interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

const uploadToCloudinary = async (
  filePath: string,
  options: UploadApiOptions = {},
): Promise<CloudinaryUploadResult> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, options);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

export default uploadToCloudinary;
