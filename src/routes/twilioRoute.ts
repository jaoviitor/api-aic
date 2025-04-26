import { Router } from 'express';
import { getToken, handleVoice } from '../controllers/twilioController';

const router = Router();

router.get('/token', getToken);
router.post('/voice', handleVoice);

export default router;