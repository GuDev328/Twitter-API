import { Router } from 'express';
import { uploadSingleImage } from '~/controllers/mediasControllers';
import { catchError } from '~/utils/handler';

const router = Router();
router.post('/upload-single-image', catchError(uploadSingleImage));

export default router;
