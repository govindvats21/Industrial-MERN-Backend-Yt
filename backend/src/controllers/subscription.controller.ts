import { asyncHandler } from "../services/asyncHandler";
import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model";
import { ApiResponse } from "../utils/ApiResponse";

export const toggleSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const { channelId } = req.params;
    // TODO: toggle subscription
    if (!mongoose.isValidObjectId(channelId)) {
      throw new ApiError(400, "Invalid Channel ID");
    }

    if (channelId.toString() === req.user?._id.toString()) {
      throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const subscriptionInstance = await Subscription.findOne({
      subscriber: req.user?._id,
      channel: channelId,
    });

    if (subscriptionInstance) {
      await Subscription.findByIdAndDelete(subscriptionInstance._id);
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { isSubscribed: false },
            "Unsubscribed successfully"
          )
        );
    } else {
      await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
      });
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { isSubscribed: true },
            "Subscribed successfully"
          )
        );
    }
  }
);

// controller to return subscriber list of a channel
export const getUserChannelSubscribers = asyncHandler(
  async (req: Request, res: Response) => {
    const { channelId } = req.params;
    if (!mongoose.isValidObjectId(channelId)) {
      throw new ApiError(400, "Invalid Channel ID");
    }

    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId as string),
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriber",
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
          subscriber: { $first: "$subscriber" },
        },
      },
      {
        $project: {
          subscriber: 1,
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(200, subscribers[0], "Subscribers fetched successfully")
      );
  }
);

// controller to return channel list to which user has subscribed
export const getsubscribedChannels = asyncHandler(
  async (req: Request, res: Response) => {
    const { subscriberId } = req.params;

    if (!mongoose.isValidObjectId(subscriberId)) {
      throw new ApiError(400, "Invalid subscriber ID");
    }

    const subscribedChannels = await Subscription.aggregate([
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(subscriberId as string),
        },
      },
      // 1. Channel ki details lao
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "subscribedChannel",
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
          subscribedChannel: { $first: "$subscribedChannel" },
        },
      },
      // 2. Us channel ki LATEST video lao (Main Logic)
      {
        $lookup: {
          from: "videos",
          localField: "channel",
          foreignField: "owner",
          as: "latestVideo",
          pipeline: [
            { $sort: { createdAt: -1 } }, // Latest video sabse upar
            { $limit: 1 }, // Sirf ek video chahiye
            {
              $project: {
                thumbnail: 1,
                title: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          latestVideo: { $first: "$latestVideo" },
        },
      },
      // 3. Jo videos nahi dalte unhe filter karna hai toh kar sakte ho,
      // varna project karke bhej do
      {
        $project: {
          subscribedChannel: 1,
          latestVideo: 1,
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribedChannels,
          "Subscribed channels and latest videos fetched successfully"
        )
      );
  }
);
