import { Request, Response } from "express";
import { asyncHandler } from "../services/asyncHandler";
import { Playlist } from "../models/playlist.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose from "mongoose";
import { Video } from "../models/video.model";

export const createPlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    //TODO: create playlist
    const { name, description } = req.body;

    if (!name || !description) {
      throw new ApiError(
        400,
        "Name and Description is required to create playlist"
      );
    }

    const playList = await Playlist.findOne({
      name: name,
      owner: req.user._id,
    });

    if (playList) {
      // playlist iss nam se phele se create ki hui h iss user se
      throw new ApiError(
        400,
        "Playlist with this name already exists for this user"
      );
    }

    const createdPlaylist = await Playlist.create({
      name,
      description,
      owner: req.user._id,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, createdPlaylist, "create a playlist successfully")
      );
  }
);

export const updatePlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist
    if (!mongoose.isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid Playlist ID format");
    }
    if (!name && !description) {
      throw new ApiError(
        400,
        "Name and Description is required to update playlist"
      );
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(400, "This palylist is not exist");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(400, "You cannot update other user playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlist._id,
      {
        name: name,
        description: description,
      },
      { new: true }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedPlaylist,
          "upadte this playlist successfully"
        )
      );
  }
);

export const deletePlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    // TODO: delete playlist
    const { playlistId } = req.params;
    if (!mongoose.isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid Playlist ID format");
    }

    const playlist = await Playlist.findOneAndDelete({
      _id: playlistId,
      owner: req.user._id,
    });
    if (!playlist) {
      throw new ApiError(
        404,
        "Playlist not found or you do not have permission to update it"
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "delete this playlist successfully"));
  }
);

export const addVideoToPlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoId, playlistId } = req.params;
    if (
      !mongoose.isValidObjectId(videoId) ||
      !mongoose.isValidObjectId(playlistId)
    ) {
      throw new ApiError(400, "Invalid Video or Comment ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    const addVideoInPlaylist = await Playlist.findOneAndUpdate(
      {
        _id: playlistId,
        owner: req.user._id,
      },
      {
        $addToSet: {
          videos: videoId,
        },
      },
      {
        new: true,
      }
    );
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          addVideoInPlaylist,
          "Add a new video in playlist successfully"
        )
      );
  }
);

export const removeVideoFromPlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoId, playlistId } = req.params;
    // TODO: remove video from playlist
    if (
      !mongoose.isValidObjectId(videoId) ||
      !mongoose.isValidObjectId(playlistId)
    ) {
      throw new ApiError(400, "Invalid Video or Comment ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    const removeVideoInPlaylist = await Playlist.findOneAndUpdate(
      {
        _id: playlistId,
        owner: req.user._id,
      },
      {
        $pull: {
          videos: videoId,
        },
      },
      {
        new: true,
      }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          removeVideoInPlaylist,
          "removes this video in playlist successfully"
        )
      );
  }
);

export const getPlaylistById = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId } = req.params;
    //TODO: get playlist by id
    if (!mongoose.isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid Playlist ID format");
    }

    const playlist = await Playlist.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(playlistId as string),
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
                avatarImage: 1,
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "videos",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "videoOnwer",
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
              $project: {
                videoFile: 1,
                title: 1,
                thumnail: 1,
                views: 1,
                duration: 1,
                createdAt: 1,
                owner: 1,
              },
            },
          ],
        },
      },

      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
          totalPlaylistVideos: {
            $size: "$videos",
          },
          totalPlaylistViews: {
            $sum: "$videos.views",
          },
        },
      },

      {
        $project: {
          title: 1,
          description: 1,
          owner: 1,
          videos: 1,
          totalPlaylistVideos: 1,
          totalPlaylistViews: 1,
          videoOwner: 1,
        },
      },
    ]);

    if (!playlist.length) {
      throw new ApiError(404, "Playlist not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));
  }
);

// backend/controllers/playlist.controller.ts

export const getUserPlaylists = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }

    const playlists = await Playlist.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId as string),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "videoDetails", // Alag naam rakho taaki confusion na ho
        },
      },
      {
        $addFields: {
          totalVideos: { $size: "$videos" },
          totalPlaylistViews: { $sum: "$videoDetails.views" },
          thumbnail: { $ifNull: [{ $first: "$videoDetails.thumbnail" }, null] },
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          totalVideos: 1,
          totalPlaylistViews: 1,
          thumbnail: 1,
          updatedAt: 1,
          videos: 1, // Ye original IDs ka array hai, comparison ke liye best hai
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(200, playlists, "User playlists fetched successfully")
      );
  }
);
