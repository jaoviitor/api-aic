import { Router } from "express";
import { createHospital } from "../controllers/databaseController";

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/createHospital', asyncHandler(createHospital));

export default router;