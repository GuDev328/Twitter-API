import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import formidable from 'formidable';
import path from 'path';
import { handleUploadSingleImage } from '~/utils/file';

export const uploadSingleImage = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await handleUploadSingleImage(req);
  res.status(200).json({
    result,
    message: 'Upload image suscess'
  });
};
