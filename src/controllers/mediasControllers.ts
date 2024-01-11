import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import formidable from 'formidable';
import path from 'path';
import mediasService from '~/services/mediaServices';

export const uploadImage = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await mediasService.handleUploadImage(req);
  res.status(200).json({
    result,
    message: 'Upload image suscess'
  });
};

export const uploadVideo = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await mediasService.handleUploadVideo(req);
  res.status(200).json({
    result,
    message: 'Upload video suscess'
  });
};

export const uploadVideoHLS = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await mediasService.handleUploadVideoHLS(req);
  res.status(200).json({
    result,
    message: 'Upload video HLS suscess'
  });
};
