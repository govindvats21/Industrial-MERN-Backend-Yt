import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/user.model.js";


export const isAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      // 401 is better here for "Not Logged In"
      throw new ApiError(401, "Token not found");
    }

    interface MyTokenPayload extends JwtPayload {
      _id: string;
    }

    // JWT verify error phenk sakta hai, isliye ye try-catch ke andar hai
    const decode = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as MyTokenPayload;

    const user = await User.findById(decode?._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token or User not found");
    }

    req.user = user;
    next();
  } catch (error: any) {
    // Agar JWT expire ho gaya ya koi aur error aaya, toh next() mein error pass karo
    next(new ApiError(401, error?.message || "Invalid access token"));
  }
};
