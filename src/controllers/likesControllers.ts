import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { LikeRequest } from '~/models/requests/LikeRequest';
import likesService from '~/services/likesServices';

export const likeController = async (req: Request<ParamsDictionary, any, LikeRequest>, res: Response) => {
  const result = await likesService.like(req.body);
  res.status(200).json({
    result,
    message: 'like suscess'
  });
};

export const unlikeController = async (req: Request<ParamsDictionary, any, LikeRequest>, res: Response) => {
  const result = await likesService.unlike(req.body);
  res.status(200).json({
    deletedCount: result,
    message: 'Unlike suscess'
  });
};
