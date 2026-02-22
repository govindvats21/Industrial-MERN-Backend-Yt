import mongoose, { Schema } from "mongoose";
import { Document } from "mongoose";

interface Isubs extends Document {
  subscriber: mongoose.Types.ObjectId;
  channel: mongoose.Types.ObjectId;
}

const subscriptionSchema = new Schema<Isubs>(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId, // one who is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<Isubs>(
  "Subscription",
  subscriptionSchema
);
