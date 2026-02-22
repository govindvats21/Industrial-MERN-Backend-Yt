import mongoose, { PipelineStage, Types } from "mongoose";
import { asyncHandler } from "../services/asyncHandler.js";
import { Request, Response } from "express";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getVideoComments = asyncHandler(
  async (req: Request, res: Response) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const commentAggregation: PipelineStage[] = [
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId as string),
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
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "comment",
          as: "asLikedBy",
        },
      },

      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
          likesCount: {
            $size: "$asLikedBy",
          },
          isLiked: {
            $cond: {
              if: { $in: [req.user?._id, "$asLikedBy.likedBy"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          content: 1,
          createdAt: 1,
          updatedAt: 1,
          owner: 1,
          likesCount: 1,
          isLiked: 1,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ];

    const options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      customLabels: {
        totalDocs: "totalComments",
        docs: "comments",
      },
    };

    const result = await Comment.aggregatePaginate(
      Comment.aggregate(commentAggregation),
      options
    );

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Comments fetched successfully"));
  }
);

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  // TODO: add a comment to a video

  const { videoId } = req.params;
  const { content } = req.body;

  if (!mongoose.isValidObjectId(videoId)) {
  }
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required to update comment");
  }

  const addComment = await Comment.create({
    content: content,
    video: videoId,
    owner: req.user._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, addComment, "add a new comment successfully"));
});

export const updateComment = asyncHandler(
  async (req: Request, res: Response) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(commentId)) {
    }
    if (!content || content.trim() === "") {
      throw new ApiError(400, "Content is required to update comment");
    }

    const updatedComment = await Comment.findOneAndUpdate(
      {
        _id: commentId,
        owner: req.user._id,
      },
      {
        $set: {
          content: content,
        },
      },
      {
        new: true,
      }
    );
    if (!updatedComment) {
      throw new ApiError(
        404,
        "Comment not found or you don't have permission to edit it"
      );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
      );
  }
);

export const deleteComment = asyncHandler(
  async (req: Request, res: Response) => {
    // TODO: delete a comment
    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
    }

    const deleteComment = await Comment.findOneAndDelete({
      _id: commentId,
      owner: req.user._id,
    });

    if (!deleteComment) {
      throw new ApiError(
        404,
        "Comment not found or you don't have permission to delete it"
      );
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment deleted successfully"));
  }
);
