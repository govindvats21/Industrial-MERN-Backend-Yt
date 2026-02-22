// 'type' keyword lagane se error chala jayega
import { type Request, type Response, type NextFunction } from "express";

export const asyncHandler = (requestHandler: (req: Request, res: Response, next: NextFunction) => any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise
            .resolve(requestHandler(req, res, next))
            .catch((err) => next(err));
    };
};

