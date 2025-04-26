import { Router } from "express";
import { getStatisticsCirurgias } from "../controllers/statisticsController";

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/cirurgia', asyncHandler(getStatisticsCirurgias));

export default router;