import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
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
import { da } from '@faker-js/faker';
// import '~/utils/faker';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
});

const users: {
  [key: string]: {
    socketId: string;
  };
} = {};

io.on('connection', (socket) => {
  console.log(socket.id + 'connected');
  const userId = socket.handshake.auth._id;
  users[userId] = {
    socketId: socket.id
  };
  console.log(users);
  socket.on('chat', (data) => {
    const contentChat = data.content;
    const receiverUserId = data.to;
    const receiverSocketId = users[receiverUserId].socketId;
    socket.to(receiverSocketId).emit('receiver-chat', {
      content: contentChat,
      from: userId
    });
  });
  socket.on('disconnect', () => {
    console.log(socket.id + ' disconnected');
    delete users[userId];
  });
});

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
httpServer.listen(port, () => console.log('API-Twitter server is running port: ' + port));
