import { Request, Response } from "express";
import { asyncHandler } from "../services/asyncHandler";
import mongoose from "mongoose";
import { Like } from "../models/like.model";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";

export const toggleVideoLike = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoId } = req.params;
    //TODO: toggle like on video

    if (!mongoose.isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid Video ID");
    }

    const existingLike = await Like.findOne({
      video: videoId,
      likedBy: req.user._id,
    });

    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      return res
        .status(200)
        .json(
          new ApiResponse(200, { isLiked: false }, "Like removed successfully")
        );
    } else {
      await Like.create({
        video: videoId,
        likedBy: req.user._id,
      });
      return res
        .status(200)
        .json(
          new ApiResponse(200, { isLiked: true }, "Video liked successfully")
        );
    }
  }
);

export const toggleCommentLike = asyncHandler(
  async (req: Request, res: Response) => {
    const { commentId } = req.params;
    //TODO: toggle like on comment
    if (!mongoose.isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid Comment ID");
    }

    const existingLike = await Like.findOne({
      video: commentId,
      likedBy: req.user._id,
    });

    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      return res
        .status(200)
        .json(
          new ApiResponse(200, { isLiked: false }, "Like removed successfully")
        );
    } else {
      await Like.create({
        video: commentId,
        likedBy: req.user._id,
      });
      return res
        .status(200)
        .json(
          new ApiResponse(200, { isLiked: true }, "Video liked successfully")
        );
    }
  }
);

export const toggleTweetLike = asyncHandler(
  async (req: Request, res: Response) => {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet
    if (!mongoose.isValidObjectId(tweetId)) {
      throw new ApiError(400, "Invalid Tweet ID");
    }

    const existingLike = await Like.findOne({
      video: tweetId,
      likedBy: req.user._id,
    });

    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      return res
        .status(200)
        .json(
          new ApiResponse(200, { isLiked: false }, "Like removed successfully")
        );
    } else {
      await Like.create({
        video: tweetId,
        likedBy: req.user._id,
      });
      return res
        .status(200)
        .json(
          new ApiResponse(200, { isLiked: true }, "Video liked successfully")
        );
    }
  }
);

export const getLikedVideos = asyncHandler(
  async (req: Request, res: Response) => {
    //TODO: get all liked videos

    const likedVideo = await Like.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(req.user?._id),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "videoDetails",
          pipeline: [
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
                    },
                  },
                ],
              },
            },
            {
              $unwind: "$owner",
            },
            {
              $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                duration: 1,
                views: 1,
                owner: 1,
              },
            },
          ],
        },
      },
      {
        // Stage 3: Video array ko object banao (taki response clean ho)
        $addFields: {
          videoDetails: { $first: "$videoDetails" },
          totalLikes: { $size: "$videoDetails" },
        },
      },
      {
        $project: {
          videoDetails: 1,
          totalLikes: 1,
        },
      },
      {
        // Stage 4: Latest liked videos ko pehle dikhao
        $sort: {
          createdAt: -1,
        },
      },
    ]);
    return res
      .status(200)
      .json(
        new ApiResponse(200, likedVideo, "Liked videos fetched successfully")
      );
  }
);
