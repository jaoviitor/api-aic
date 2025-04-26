import { Router } from "express";
import { getConversations } from "../controllers/wudController";

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/getConversations/:userId', asyncHandler(getConversations));

export default router;