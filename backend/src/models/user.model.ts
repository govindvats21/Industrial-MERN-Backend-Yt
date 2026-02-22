import mongoose, { Document } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// 1. Pehle interface mein methods define karo
interface Iuser extends Document {
  userName: string;
  fullName: string;
  avatarImage: string;
  coverImage?: string;
  email: string;
  description?: string;
  password: string;
  refreshToken?: string;
  watchHistory?: mongoose.Types.ObjectId[];
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const userSchema = new mongoose.Schema<Iuser>(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: { type: String, required: true, trim: true, index: true },
    description:{
      type: String,
    },
    avatarImage: { type: String, required: true },
    coverImage: { type: String },
    watchHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    password: { type: String, required: [true, "Password is required"] },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

// Password Hashing
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Method: Password Check
userSchema.methods.isPasswordCorrect = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

// Method: Generate Access Token (Yahan 'as any' use kar sakte ho agar Overload error na jaye)
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY as any, // 'any' ya 'string' use karo
    }
  ) as string;
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY as any,
    }
  );
};

export const User = mongoose.model<Iuser>("User", userSchema);
