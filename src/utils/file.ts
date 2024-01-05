import path from 'path';
import { Request, Response } from 'express';
import { ErrorWithStatus } from '~/models/Errors';
import { httpStatus } from '~/constants/httpStatus';
import { File } from 'formidable';

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default;
  const form = formidable({
    uploadDir: path.resolve('uploads/temp'),
    maxFiles: 10,
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024, // 20MB
    maxTotalFileSize: 200 * 1024 * 1024, // 100MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'));
      if (!valid) {
        form.emit(
          'error' as any,
          new ErrorWithStatus({
            status: httpStatus.BAD_REQUEST,
            message: 'Invalid file type'
          }) as any
        );
      }
      return valid;
    }
  });
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      }
      if (!files.image) {
        reject(
          new ErrorWithStatus({
            status: httpStatus.BAD_REQUEST,
            message: 'Required file is missing'
          }) as any
        );
      }
      resolve(files.image as File[]);
    });
  });
};
