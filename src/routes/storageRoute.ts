import { Router } from "express";
import { getBlob } from "../controllers/storageController";

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/:containerName/getBlob/:blobName', asyncHandler(getBlob));

export default router;