import { Request, Response } from "express";
import { asyncHandler } from "../services/asyncHandler";
import { Tweet } from "../models/tweet.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose from "mongoose";

export const createTweet = asyncHandler(async (req: Request, res: Response) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Please add some content");
  }
  if (!req.user) {
    throw new ApiError(400, "please login");
  }

  const tweet = await Tweet.create({
    content: content,
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(201, tweet, "Tweet successfully created"));
});

export const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "userId not found");
  }

  const userTweets = await Tweet.find({ owner: userId }).populate(
    "owner",
    "userName avatarImage"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "Get User Tweets"));
});

export const updateTweet = asyncHandler(async (req: Request, res: Response) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;
  if (!content.trim()) {
    throw new ApiError(400, "Please add some content");
  }
  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Tweet not found");
  }

  const updateTweet = await Tweet.findOneAndUpdate(
    {
      _id: tweetId,
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

  if (!updateTweet) {
    throw new ApiError(404, "Tweet not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updateTweet, "Tweet Updated successfully created")
    );
});

export const deleteTweet = asyncHandler(async (req: Request, res: Response) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Tweet not found");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "this tweet not found");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You cannot delete someone else's tweet");
  }
  await Tweet.findByIdAndDelete(tweetId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});
