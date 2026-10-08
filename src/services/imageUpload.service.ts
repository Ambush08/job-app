import cloudinary from '../config/cloudinary.js';

interface CloudinaryUploadResult {
    url: string;
    publicId: string;
}

const uploadToCloudinary = async (filePath: string): Promise<CloudinaryUploadResult> => {
    try{
        const result = await cloudinary.uploader.upload(filePath);

        return {
            url: result.secure_url,
            publicId: result.public_id
        }
    }catch(error){
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
}

export default uploadToCloudinary;