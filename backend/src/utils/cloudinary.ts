import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
export const uploadOnCloudinary = async (localPath: string) => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    if (!localPath) return null;

    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localPath);
    return response;
  } catch (error) {
    fs.unlinkSync(localPath);
    return null;
  }
};

export const deleteFromCloudinary = async (url: string) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    if (!url) return null;

    const publicId = url.split("/").pop()?.split(".")[0];
    if (!publicId) {
      console.log("Could not extract Public ID from URL");
      return null;
    }
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.log("Error deleting from Cloudinary", error);
    return null;
  }
};
