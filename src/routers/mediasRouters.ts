import { Router } from 'express';
import { access } from 'fs';
import { uploadImage, uploadVideo, uploadVideoHLS } from '~/controllers/mediasControllers';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';

const router = Router();
router.post('/upload-image', accessTokenValidator, verifiedUserValidator, catchError(uploadImage));
router.post('/upload-video', accessTokenValidator, verifiedUserValidator, catchError(uploadVideo));
router.post('/upload-video-hls', accessTokenValidator, verifiedUserValidator, catchError(uploadVideoHLS));
export default router;
