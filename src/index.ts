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
import conversationsRouters from '~/routers/conversationsRouters';
import db from './services/databaseServices';
import { defaultsErrorHandler } from './middlewares/errorsMiddlewares';
import path from 'path';
import cors from 'cors';
import { da, fr } from '@faker-js/faker';
import Conversation from './models/schemas/ConversationSchema';
import { ObjectId } from 'mongodb';
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
  const userId = socket.handshake.auth._id;
  users[userId] = {
    socketId: socket.id
  };
  socket.on('chat', async (data) => {
    const contentChat = data.content;
    const receiverUserId = data.receiver_id;
    const fromUserId = data.sender_id;
    const receiverSocketId = users[receiverUserId]?.socketId;

    await db.conversations.insertOne(
      new Conversation({
        sender_id: new ObjectId(fromUserId),
        receiver_id: new ObjectId(receiverUserId),
        content: contentChat
      })
    );

    if (receiverSocketId) {
      socket.to(receiverSocketId).emit('receiver-chat', {
        sender_id: fromUserId,
        receiver_id: receiverSocketId,
        content: contentChat
      });
    }
  });
  socket.on('disconnect', () => {
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
app.use('/conversations', conversationsRouters);
app.use(defaultsErrorHandler);

const port = process.env.PORT || 3030;
httpServer.listen(port, () => console.log('API-Twitter server is running port: ' + port));
