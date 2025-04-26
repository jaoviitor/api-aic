import { Router } from "express";
import { uploadFile } from "../controllers/uploadController";

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/uploadFile', asyncHandler(uploadFile));

export default router;