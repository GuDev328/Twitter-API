import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import conversationsService from '~/services/conversationsServices';

export const getConversationController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const receiverUserId = req.params.receiverUserId;
  const senderId = req.body.decodeAuthorization.payload.userId;
  const limit = Number(req.query.limit as string);
  const page = Number(req.query.page as string);
  const { result, total_page } = await conversationsService.getConversation(senderId, receiverUserId, limit, page);
  res.status(200).json({
    result,
    total_page,
    message: 'Get conversation suscess'
  });
};
