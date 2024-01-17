import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { BookmarkRequest } from '~/models/requests/BookmarkRequest';
import bookmarksService from '~/services/bookmarksServices';

export const bookmarkController = async (req: Request<ParamsDictionary, any, BookmarkRequest>, res: Response) => {
  const result = await bookmarksService.bookmark(req.body);
  res.status(200).json({
    result,
    message: 'Bookmark suscess'
  });
};

export const unbookmarkController = async (req: Request<ParamsDictionary, any, BookmarkRequest>, res: Response) => {
  const result = await bookmarksService.unbookmark(req.body);
  res.status(200).json({
    deletedCount: result,
    message: 'Unbookmark suscess'
  });
};
