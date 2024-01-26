import { Router } from 'express';
import { searchController } from '~/controllers/searchControllers';
import { searchValidator } from '~/middlewares/searchMiddlewares';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/usersMiddlewares';
const router = Router();

router.get('/', searchValidator, accessTokenValidator, verifiedUserValidator, searchController);

export default router;
