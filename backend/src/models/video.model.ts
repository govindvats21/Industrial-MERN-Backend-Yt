import mongoose, { AggregatePaginateModel, Document } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

interface IVid extends Document {
  videoFile: string;
  thumbnail: string;
  title: string;
  description: string;
  duration: number;
  views: number;
  isPublished: boolean;
  owner: mongoose.Types.ObjectId;
}

const videoSchema = new mongoose.Schema<IVid>(
  {
    videoFile: {
      type: String, //cloudinary url
      required: true,
    },
    thumbnail: {
      type: String, //cloudinary url
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.plugin(aggregatePaginate);

export const Video = mongoose.model<IVid, AggregatePaginateModel<IVid>>("Video", videoSchema);
