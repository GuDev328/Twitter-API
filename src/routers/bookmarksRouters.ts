import { Router } from 'express';
import { bookmarkController, unbookmarkController } from '~/controllers/bookmarksControllers';
import { bookmarkValidator } from '~/middlewares/bookmarksMiddlewares';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post(
  '/bookmark',
  accessTokenValidator,
  verifiedUserValidator,
  bookmarkValidator,
  catchError(bookmarkController)
);
router.post(
  '/un-bookmark',
  accessTokenValidator,
  verifiedUserValidator,
  bookmarkValidator,
  catchError(unbookmarkController)
);

export default router;
