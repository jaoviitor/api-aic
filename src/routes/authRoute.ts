import { Router } from 'express';
import { getToken } from '../controllers/authController';

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/token', asyncHandler(getToken));

export default router;