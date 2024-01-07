import { Router } from 'express';
import { access } from 'fs';
import { uploadImage, uploadVideo } from '~/controllers/mediasControllers';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';

const router = Router();
router.post('/upload-image', accessTokenValidator, verifiedUserValidator, catchError(uploadImage));
router.post('/upload-video', accessTokenValidator, verifiedUserValidator, catchError(uploadVideo));

export default router;
