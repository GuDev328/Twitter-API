import { Router } from 'express';
import { createTweetController } from '~/controllers/tweetsControllers';
import { createTweetValidator } from '~/middlewares/tweetsMiddlewares';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post(
  '/create-tweet',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  catchError(createTweetController)
);

export default router;
