import { Router } from 'express';
import usersMiddlewares from '~/middlewares/usersMiddlewares';
import usersController from '~/controllers/usersControllers';
const router = Router();

router.post('/login', usersMiddlewares.loginValidator, usersController.loginController);
router.post('/register', usersMiddlewares.registerValidator, usersController.registerController);
export default router;
