import { Router } from 'express';
import { getMeetings, getMeetingsVendas, convertAudioToBase64, handleSpeechTranscription, handleSpeechTranscriptionFromVideo, getTranscriptController } from '../controllers/aiscribeController';

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/getMeetings', asyncHandler(getMeetings));
router.get('/getMeetingsVendas', asyncHandler(getMeetingsVendas));
router.get("/transcribe/audio/:fileName", asyncHandler(handleSpeechTranscription));
router.get('/transcript/:botId', asyncHandler(getTranscriptController));
router.post('/transcribe/video', asyncHandler(handleSpeechTranscriptionFromVideo));
router.post("/audio/convert", asyncHandler(convertAudioToBase64));

export default router;