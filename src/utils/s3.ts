import { Upload } from '@aws-sdk/lib-storage';
import { S3 } from '@aws-sdk/client-s3';
import fs from 'fs';
import env from 'dotenv';
import { Response } from 'express';
import { httpStatus } from '~/constants/httpStatus';
env.config();
const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
});

export const UploadFileToS3 = async (fileName: string, filePath: string, fileType: string) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: { Bucket: process.env.S3_NAME, Key: fileName, Body: fs.readFileSync(filePath), ContentType: fileType },

    tags: [
      /*...*/
    ], // optional tags
    queueSize: 4, // optional concurrency configuration
    partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
    leavePartsOnError: false // optional manually handle dropped parts
  });

  return parallelUploads3.done();
};

export const sendFileFromS3 = async (res: Response, filePath: string) => {
  try {
    const data = await s3.getObject({
      Bucket: process.env.S3_NAME,
      Key: filePath
    });
    (data.Body as any).pipe(res);
  } catch (e) {
    res.status(httpStatus.NOT_FOUND).json(e);
  }
};
