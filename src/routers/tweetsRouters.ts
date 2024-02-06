import { Router } from 'express';
import {
  createTweetController,
  getNewsFeedController,
  getTweetChildrenController,
  getTweetController
} from '~/controllers/tweetsControllers';
import {
  audienceValidator,
  createTweetValidator,
  getNewsFeedValidator,
  getTweetChildrenValidator,
  tweetIdValidator
} from '~/middlewares/tweetsMiddlewares';
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

/**
Header: {Authorization?: Bearer <access_token>}
Query: {limit: number, page: number, tweet_type: TweetType}
 */
router.get(
  '/tweet/:id/children',
  getTweetChildrenValidator,
  tweetIdValidator,
  isLoginValidator(accessTokenValidator),
  isLoginValidator(verifiedUserValidator),
  catchError(audienceValidator),
  catchError(getTweetChildrenController)
);

/**
 * Description: Get new feeds
 * Header: {Authorization: Bearer <access_token>}
 * Query: {limit: number, page: number}
 */
router.get('/', getNewsFeedValidator, accessTokenValidator, verifiedUserValidator, catchError(getNewsFeedController));
export default router;
