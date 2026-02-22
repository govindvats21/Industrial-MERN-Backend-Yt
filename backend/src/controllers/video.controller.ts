import multer from "multer";
import { asyncHandler } from "../services/asyncHandler";
import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary";
import { Video } from "../models/video.model";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose, { PipelineStage } from "mongoose";
import { User } from "../models/user.model";

export const publishAVideo = asyncHandler(
  async (req: Request, res: Response) => {
    // TODO: get video, upload to cloudinary, create video
    const { title, description } = req.body;
    if (!req.user) {
      throw new ApiError(400, "plz signin");
    }
    if (!title || !description) {
      throw new ApiError(400, "plz enter all fields");
    }

    const { videoFile, thumbnail } = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const videoLocalPath = videoFile?.[0]?.path;
    if (!videoLocalPath) {
      throw new ApiError(400, "video path is misssing");
    }
    const thumbnailLocalPath = thumbnail?.[0]?.path;
    if (!thumbnailLocalPath) {
      throw new ApiError(400, "thumnail path is misssing");
    }

    const videoUrl = await uploadOnCloudinary(videoLocalPath);
    if (!videoUrl) {
      throw new ApiError(400, "Video upload failed");
    }
    const thumbnailUrl = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnailUrl) {
      throw new ApiError(400, "Thumbnail upload failed");
    }

    const video = await Video.create({
      title,
      description,
      videoFile: videoUrl?.url,
      thumbnail: thumbnailUrl?.url,
      duration: videoUrl?.duration,
      owner: req.user._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(200, video, "User registered Successfully"));
  }
);

export const getVideoById = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoId } = req.params;
    //TODO: get video by id
    if (!mongoose.isValidObjectId(videoId)) {
    }

    const video = await Video.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId as string),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                userName: 1,
                fullName: 1,
                avatarImage: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: { $first: "$owner" },
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "owner._id",
          foreignField: "channel",
          as: "subscribers",
        },
      },

      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likedBy",
        },
      },

      {
        $addFields: {
          subscribersCount: { $size: "$subscribers" }, // Array ki length nikal li
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] }, // Check user login hai aur subscribed hai
              then: true,
              else: false,
            },
          },
          likesCount: { $size: "$likedBy" }, // Array ki length nikal li
          isLiked: {
            $cond: {
              if: { $in: [req.user?._id, "$likedBy.likedBy"] }, // Liked model mein field ka naam check karna (aksar 'likedBy' ya 'user' hota hai)
              then: true,
              else: false,
            },
          },
        },
      },

      {
        $project: {
          owner: 1,
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
          subscribersCount: 1, // Ise project karna mat bhulna
          isSubscribed: 1,
          likesCount: 1,
          isLiked: 1,
        },
      },
    ]);

    const vidObjId = new mongoose.Types.ObjectId(videoId as string);
    const history = req.user?.watchHistory as mongoose.Types.ObjectId[];
    if (req.user) {
      if (!history?.includes(vidObjId)) {
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: {
            watchHistory: vidObjId,
          },
        });

        await Video.findByIdAndUpdate(videoId, {
          $inc: { views: 1 },
        });

        video[0].views += 1;
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, video[0], "Video fetched successfully"));
  }
);

export const updateVideo = asyncHandler(async (req: Request, res: Response) => {
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;
  const { title, description } = req.body;
  const file = req.file as Express.Multer.File;
  const thumbnailLocalPath = file.path;

  if (!req.user) {
    throw new ApiError(400, "plz signin");
  }

  if (!mongoose.isValidObjectId(videoId)) {
  }

  if (!title && !description && !thumbnailLocalPath) {
    throw new ApiError(400, "At least one field is required to update");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized request");
  }

  const oldthumbnailPath = video.thumbnail;

  let newThumbnail;
  if (thumbnailLocalPath) {
    newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  }

  if (!newThumbnail) {
    throw new ApiError(400, "Error while uploading thumbnail");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    video._id,
    {
      $set: {
        title: title || video.title,
        description: description || video.description,
        thumnail: newThumbnail ? newThumbnail.url : video.thumbnail,
      },
    },
    { new: true }
  );

  if (oldthumbnailPath) {
    await deleteFromCloudinary(oldthumbnailPath);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));

  //     //TODO: update video details like title, description, thumbnail
});

export const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!req.user) {
    throw new ApiError(400, "plz signin");
  }

  if (!mongoose.isValidObjectId(videoId)) {
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized request");
  }

  await deleteFromCloudinary(video.thumbnail);
  await deleteFromCloudinary(video.videoFile);

  await Video.findByIdAndDelete(videoId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

export const togglePublishStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoId } = req.params;
    if (!req.user) {
      throw new ApiError(400, "plz signin");
    }

    if (!mongoose.isValidObjectId(videoId)) {
    }

    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Unauthorized request");
    }
    video.isPublished = !video.isPublished;

    await video.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video published successfully"));
  }
);

export const getAllVideos = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination

    const aggregateQuery: PipelineStage[] = [
      {
        $match: {
          $and: [
            query
              ? {
                  $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } },
                  ],
                }
              : {},
            userId
              ? { owner: new mongoose.Types.ObjectId(userId as string) }
              : {},
            { isPublished: true },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails",
          pipeline: [
            {
              $project: {
                userName: 1,
                fullName: 1,
                avatarImage: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$ownerDetails",
      },
      {
        $project: {
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
          isPublished: 1,
          ownerDetails: 1,
        },
      },
      {
        $sort: {
          [(sortBy as string) || "createdAt"]: sortType === "asc" ? 1 : -1,
        },
      },
    ];

    const options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      customLabels: {
        totalDocs: "totalVideos",
        docs: "videos",
      },
    };

    const result = await Video.aggregatePaginate(
      Video.aggregate(aggregateQuery),
      options
    );
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Videos fetched successfully"));
  }
);
