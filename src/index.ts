import express, { Router } from 'express';
import dotenv from 'dotenv';
import usersRouters from '~/routers/usersRouters';
import db from './services/databaseServices';
import { defaultsErrorHandler } from './middlewares/errorsMidware';

const app = express();
dotenv.config();
db.connect();

const router = Router();
app.use(express.json());
app.use('/users', usersRouters);
app.use(defaultsErrorHandler);
const port = 3030;
app.listen(port, () => console.log('API-Twitter server is running port: ' + port));
