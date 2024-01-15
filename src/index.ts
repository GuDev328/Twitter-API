import express from 'express';
import dotenv from 'dotenv';
import usersRouters from '~/routers/usersRouters';
import mediasRouters from '~/routers/mediasRouters';
import db from './services/databaseServices';
import { defaultsErrorHandler } from './middlewares/errorsMidware';
import path from 'path';
import cors from 'cors';

const app = express();
dotenv.config();
db.connect();

app.use(cors());
app.use(express.json());

app.use('/users', usersRouters);
app.use('/medias', mediasRouters);
app.use('/image', express.static(path.resolve('uploads/images')));
app.use('/video', express.static(path.resolve('uploads/videos')));
app.use(defaultsErrorHandler);
const port = process.env.PORT || 3030;
app.listen(port, () => console.log('API-Twitter server is running port: ' + port));
