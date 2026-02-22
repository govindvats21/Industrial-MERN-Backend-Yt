import mongoose, { Schema, Document, AggregatePaginateModel } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

// 1. Define your document interface
interface IComment extends Document {
  content: string;
  video: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
}

// 2. Define the Schema
const commentSchema = new Schema<IComment>({
  content: { type: String, required: true },
  video: { type: Schema.Types.ObjectId, ref: "Video" },
  owner: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// 3. Plug in the paginator
commentSchema.plugin(aggregatePaginate);

// 4. Export the model with the combined type
// This is the crucial part for fixing the TS error
export const Comment = mongoose.model<IComment, AggregatePaginateModel<IComment>>(
  "Comment", 
  commentSchema
);