import { Router } from 'express';
import { getConversationController } from '~/controllers/conversationsControllers';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.get(
  '/get-conversation/:receiverUserId',
  accessTokenValidator,
  verifiedUserValidator,
  catchError(getConversationController)
);

export default router;
