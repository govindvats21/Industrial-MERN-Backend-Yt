import { User } from "../models/user.model";

declare global {
  namespace Express {
    interface Request {
   user: IUser & { _id: mongoose.Types.ObjectId };
      cookies: {
        accessToken?: string;
        refreshToken?: string;
        [key: string]: string | undefined;
      };
      
    }
  }
}

export {}