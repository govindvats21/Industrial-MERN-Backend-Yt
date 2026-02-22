import mongoose, { Schema } from "mongoose";

interface ILike {
  video: mongoose.Types.ObjectId;
  comment: mongoose.Types.ObjectId;
  tweet: mongoose.Types.ObjectId;
  likedBy: mongoose.Types.ObjectId;
}

const likeSchema = new Schema<ILike>(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model<ILike>("Like", likeSchema);
