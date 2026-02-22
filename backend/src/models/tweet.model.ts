import mongoose from "mongoose";
import { Document } from "mongoose";

interface ITweet extends Document {
  content: string;
  owner: mongoose.Types.ObjectId;
}

const tweetSchema = new mongoose.Schema<ITweet>(
  {
    content: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Tweet = mongoose.model<ITweet>("Tweet", tweetSchema);
