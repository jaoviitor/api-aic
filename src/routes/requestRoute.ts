import { Router } from "express";
import { getRequestsHandler, getGeralHandler } from "../controllers/requestController";

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/getRequests', asyncHandler(getRequestsHandler));
router.get('/getGeral', asyncHandler(getGeralHandler));

export default router;