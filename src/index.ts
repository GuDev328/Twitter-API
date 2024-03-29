import express from 'express';
import { createServer } from 'http';
import usersRouters from '~/routers/usersRouters';
import mediasRouters from '~/routers/mediasRouters';
import tweetsRouters from '~/routers/tweetsRouters';
import bookmarksRouters from '~/routers/bookmarksRouters';
import likesRouters from '~/routers/likesRouters';
import searchRouters from '~/routers/searchRouters';
import conversationsRouters from '~/routers/conversationsRouters';
import db from './services/databaseServices';
import { defaultsErrorHandler } from './middlewares/errorsMiddlewares';
import cors, { CorsOptions } from 'cors';
import initializeSocket from './utils/socket';
// import '~/utils/faker';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import YAML from 'yaml';
import path from 'path';
import { env, isProduction } from './constants/config';
import helmet from 'helmet';

const file = fs.readFileSync(path.resolve('src/swagger.yaml'), 'utf8');
const swaggerDocument = YAML.parse(file);

const app = express();
const httpServer = createServer(app);

db.connect().then(() => {
  db.indexUsersCollection();
  db.indexTweetsCollection();
});

const corsConfig: CorsOptions = {
  origin: isProduction ? env.clientUrl : '*'
};

app.use(helmet());
app.use(cors(corsConfig));
app.use(express.json());

initializeSocket(httpServer);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/users', usersRouters);
app.use('/medias', mediasRouters);
app.use('/tweets', tweetsRouters);
app.use('/bookmarks', bookmarksRouters);
app.use('/likes', likesRouters);
app.use('/search', searchRouters);
app.use('/conversations', conversationsRouters);
app.use(defaultsErrorHandler);

const port = env.port || 3030;
httpServer.listen(port, () => console.log('API-Twitter server is running port: ' + port));
