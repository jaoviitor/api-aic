import { Router } from "express";
import { processVitalCv } from "../controllers/vitalCvController";

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/processVitalCv', asyncHandler(processVitalCv));

export default router;