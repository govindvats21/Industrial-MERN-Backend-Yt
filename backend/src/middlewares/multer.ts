import multer from "multer";
import { type Request } from "express";
const storage = multer.diskStorage({
    destination: function(req: Request, file: Express.Multer.File, cb){
cb(null, "./public")
    },
    filename: function(req: Request, file: Express.Multer.File, cb) {
        cb(null, file.originalname)
    }
})


export const upload = multer({ storage });