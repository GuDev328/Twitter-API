import express from 'express';
import dotenv from 'dotenv';
import usersRouters from '~/routers/usersRouters';
import mediasRouters from '~/routers/mediasRouters';
import tweetsRouters from '~/routers/tweetsRouters';
import bookmarksRouters from '~/routers/bookmarksRouters';
import likesRouters from '~/routers/likesRouters';
import searchRouters from '~/routers/searchRouters';
import db from './services/databaseServices';
import { defaultsErrorHandler } from './middlewares/errorsMiddlewares';
import path from 'path';
import cors from 'cors';
// import '~/utils/faker';

const app = express();
dotenv.config();
db.connect().then(() => {
  db.indexUsersCollection();
  db.indexTweetsCollection();
});

app.use(cors());
app.use(express.json());

app.use('/users', usersRouters);
app.use('/medias', mediasRouters);
app.use('/tweets', tweetsRouters);
app.use('/bookmarks', bookmarksRouters);
app.use('/likes', likesRouters);
app.use('/search', searchRouters);
app.use(defaultsErrorHandler);
const port = process.env.PORT || 3030;
app.listen(port, () => console.log('API-Twitter server is running port: ' + port));
