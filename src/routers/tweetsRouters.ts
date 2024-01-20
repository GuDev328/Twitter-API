import { Router } from 'express';
import { createTweetController, getTweetController } from '~/controllers/tweetsControllers';
import { audienceValidator, createTweetValidator, tweetIdValidator } from '~/middlewares/tweetsMiddlewares';
import { accessTokenValidator, isLoginValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post(
  '/create-tweet',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  catchError(createTweetController)
);

router.get(
  '/tweet/:id',
  tweetIdValidator,
  isLoginValidator(accessTokenValidator),
  isLoginValidator(verifiedUserValidator),
  catchError(audienceValidator),
  catchError(getTweetController)
);

export default router;
