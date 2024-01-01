import express, { Router } from 'express';
import dotenv from 'dotenv';
import usersRouters from '~/routers/usersRouters';
import mediasRouters from '~/routers/mediasRouters';
import db from './services/databaseServices';
import { defaultsErrorHandler } from './middlewares/errorsMidware';
import path from 'path';

const app = express();
dotenv.config();
db.connect();

const router = Router();
app.use(express.json());
app.use(express.static('uploads'));
app.use('/users', usersRouters);
app.use('/medias', mediasRouters);
app.use(defaultsErrorHandler);
const port = 3030;
app.listen(port, () => console.log('API-Twitter server is running port: ' + port));
