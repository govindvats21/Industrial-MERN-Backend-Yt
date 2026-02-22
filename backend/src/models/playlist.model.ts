import mongoose from "mongoose";

interface IPlaylist {
    name: string,
    description: string,
    videos: mongoose.Types.ObjectId[],
    owner: mongoose.Types.ObjectId
}



const playlistSchema = new mongoose.Schema<IPlaylist>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Playlist = mongoose.model<IPlaylist>("Playlist", playlistSchema);
