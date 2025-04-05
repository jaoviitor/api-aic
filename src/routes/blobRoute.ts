import { Router } from 'express';
import { getBlobUrl } from '../controllers/blobController';

const router = Router();

router.get('/getBlobUrl/:blobName', getBlobUrl);

export default router;