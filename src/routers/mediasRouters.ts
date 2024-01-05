import { Router } from 'express';
import { uploadImage } from '~/controllers/mediasControllers';
import { catchError } from '~/utils/handler';

const router = Router();
router.post('/upload-image', catchError(uploadImage));

export default router;
