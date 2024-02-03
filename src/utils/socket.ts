import { Server } from 'socket.io';
import { Server as ServerHttp } from 'http';
import { accessTokenValidate } from './common';
import { UserVerifyStatus } from '~/constants/enum';
import { ErrorWithStatus } from '~/models/Errors';
import { httpStatus } from '~/constants/httpStatus';
import db from '~/services/databaseServices';
import Conversation from '~/models/schemas/ConversationSchema';
import { ObjectId } from 'mongodb';

const initializeSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*'
    }
  });

  io.use(async (socket, next) => {
    try {
      const decodeAuthorization = await accessTokenValidate(socket.handshake.auth.access_token);
      const { verify } = decodeAuthorization.payload;
      if (verify !== UserVerifyStatus.Verified) {
        throw new ErrorWithStatus({
          message: 'User not Verified',
          status: httpStatus.FORBIDDEN
        });
      }
      socket.handshake.auth.decodeAuthorization = decodeAuthorization.payload;
      next();
    } catch (error) {
      next({
        message: (error as ErrorWithStatus).message,
        name: 'AuthorizationError',
        data: error
      });
    }
  });

  const users: {
    [key: string]: {
      socketId: string;
    };
  } = {};

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.decodeAuthorization.userId;
    users[userId] = {
      socketId: socket.id
    };
    socket.use(async (pocket, next) => {
      try {
        await accessTokenValidate(socket.handshake.auth.access_token);
        next();
      } catch (error) {
        next({
          message: (error as ErrorWithStatus).message,
          name: 'AuthorizationError'
        });
      }
    });

    socket.on('error', async (err) => {
      if (err.name === 'AuthorizationError') {
        socket.disconnect();
      }
    });

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
};

export default initializeSocket;
