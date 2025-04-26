import { Router } from "express";
import { getEvaluation } from "../controllers/evaluationController";

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/getEvaluation', asyncHandler(getEvaluation));

export default router;