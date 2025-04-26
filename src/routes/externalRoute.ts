import { Router } from 'express';
import { getCep } from '../controllers/externalController';
import { convertAudio } from "../controllers/audioController";

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/getCep/:cep', asyncHandler(getCep));
router.post('/convertAudio', asyncHandler(convertAudio));

export default router;