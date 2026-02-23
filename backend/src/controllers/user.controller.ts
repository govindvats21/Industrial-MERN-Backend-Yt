import mongoose from "mongoose";

import { asyncHandler } from "../services/asyncHandler.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";


const generateAccessAndRefreshTokens = async (
  userId: mongoose.Types.ObjectId
) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {}
};

export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { fullName, email, userName, password } = req.body as Record<
      string,
      string
    >;
    if (
      [fullName, email, userName, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
      $or: [{ userName }, { email }],
    });

    if (existedUser) {
      throw new ApiError(409, "User with email or username already exists");
    }
    const files = req.files as any;

    const avatarImageLocalPath = files?.avatarImage[0]?.path;
    let coverImageLocalPath;
    if (
      req.files &&
      Array.isArray(files.coverImage) &&
      files.coverImage.length > 0
    ) {
      coverImageLocalPath = files.coverImage[0]?.path;
    }

    if (!avatarImageLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }

    const avatarImage = await uploadOnCloudinary(avatarImageLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatarImage) {
      throw new ApiError(400, "Avatar files is required");
    }

    const user = await User.create({
      fullName,
      email,
      userName,
      password,
      avatarImage: avatarImage?.url,
      coverImage: coverImage?.url || "",
    });

    const tokens = await generateAccessAndRefreshTokens(user._id);

    if (!tokens) {
      throw new ApiError(400, "Failed to generate tokens");
    }

    const { accessToken, refreshToken } = tokens;

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    return res
      .status(201)
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none" as const,
        maxAge: 10 * 24 * 60 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none" as const,
        maxAge: 10 * 24 * 60 * 60 * 1000,
      })
      .json(
        new ApiResponse(
          201,
          { createdUser, accessToken, refreshToken },
          "User registered successfully"
        )
      );
  }
);

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, userName, password } = req.body as Record<string, string>;
  if (!(userName || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({
    $or: [{ email: email || "" }, { userName: userName || "" }],
  });
  if (!user) {
    throw new ApiError(400, "user not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const tokens = await generateAccessAndRefreshTokens(user._id);

  if (!tokens) {
    throw new ApiError(400, "Failed to generate tokens");
  }

  const { accessToken, refreshToken } = tokens;

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      maxAge: 10 * 24 * 60 * 60 * 1000,
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      maxAge: 10 * 24 * 60 * 60 * 1000,
    })
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", { httpOnly: true, secure: true })
    .clearCookie("refreshToken", { httpOnly: true, secure: true })
    .json(new ApiResponse(200, {}, "User logged Out"));
});

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request");
    }
    interface MyTokenPayload extends jwt.JwtPayload {
      _id: string;
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as MyTokenPayload;
    if (!decodedToken) {
      throw new ApiError(401, "unauthorized request");
    }

    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const updatedToken = await generateAccessAndRefreshTokens(user._id);
    if (!updatedToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } = updatedToken;

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  }
);

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    // verifyJWT ne req.user pehle hi set kar diya hai
    const user = req.user;

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User fetched successfully"));
  }
);

export const changeCurrentPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body as Record<string, string>;

    if (!oldPassword || !newPassword) {
      throw new ApiError(400, "plz enter all fields");
    }

  const user = await User.findById(req.user?._id);
  if (!user) {
      throw new ApiError(404, "User not found");
    }
    const isPasswordCorrect = await user?.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  }
);

export const updateAccountDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { fullName, description } = req.body as Record<string, string>;
    if (!fullName && !description) {
      throw new ApiError(400, "All fields are required");
    }
    const user = req.user;
    if (!user) {
      throw new ApiError(401, "User not authenticated");
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          fullName,
          description,
        },
      },
      {
        new: true,
      }
    ).select("-password");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: updatedUser },
          "Account details updated successfully"
        )
      );
  }
);

export const updateUserAvatarImage = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new ApiError(401, "User not authenticated");
    }

    const file = req.file as any;
    const avatarImageLocalPath = file?.path;

    if (!avatarImageLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
    }

    const oldAvatarUrl = req.user?.avatarImage;

    const avatarImage = await uploadOnCloudinary(avatarImageLocalPath);
    if (!avatarImage) {
      throw new ApiError(400, "Error while uploading on avatar");
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        avatarImage: avatarImage.url,
      },
      {
        new: true,
      }
    ).select("-password");

    if (oldAvatarUrl) {
      await deleteFromCloudinary(oldAvatarUrl);
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: updatedUser },
          "Avatar image updated successfully"
        )
      );
  }
);

export const updateUserCoverImage = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new ApiError(401, "User not authenticated");
    }

    const file = req.file as any;
    const coverImageLocalPath = file?.path;

    if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover file is missing");
    }

    const oldCoverUrl = req.user?.coverImage;

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage) {
      throw new ApiError(400, "Error while uploading on cover image");
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        coverImage: coverImage.url,
      },
      {
        new: true,
      }
    ).select("-password");

    if (oldCoverUrl) {
      await deleteFromCloudinary(oldCoverUrl);
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: updatedUser },
          "Avatar image updated successfully"
        )
      );
  }
);

export const getUserChannelProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { userName } = req.params;
    if (!userName) {
      throw new ApiError(400, "username is missing");
    }

    const channel = await User.aggregate([
      {
        $match: {
          userName: userName,
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          channelsSubscribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullName: 1,
          email: 1,
          userName: 1,
          avatarImage: 1,
          coverImage: 1,
          isSubscribed: 1,
          subscribersCount: 1,
          channelsSubscribedToCount: 1,
        },
      },
    ]);

    if (!channel?.length) {
      throw new ApiError(404, "channel does not exists");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
      );
  }
);

export const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory", // Ye array banayega
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner", // Ye bhi array banayega
            },
          },
          {
            $addFields: {
              // Yahan check karo ki "$owner" array hai ya nahi
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user.length) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, user[0].watchHistory, "History fetched successfully")
    );
});

// Example API Logic
export const clearWatchHistory = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { watchHistory: [] },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Watch history cleared successfully"));
});
