import { Request, Response } from 'express';
import searchServices from '~/services/searchServices';

export const searchController = async (req: Request, res: Response) => {
  const userId = req.body.decodeAuthorization.payload.userId;
  const key = req.query.key as string;
  const limit = Number(req.query.limit as string);
  const page = Number(req.query.page as string);
  const onlyFollowedUsers = Boolean(req.query.onlyFollowedUsers);
  const result = await searchServices.search(userId, key, limit, page, onlyFollowedUsers);
  res.status(200).json({
    result,
    message: 'Search suscess'
  });
};
