import { Request } from 'express';
import path from 'path';
import sharp from 'sharp';
import db from '~/services/databaseServices';
import { handleUploadImage, handleUploadVideo } from '~/utils/file';
import fs from 'fs-extra';
import { isProduction } from '~/constants/config';
import { config } from 'dotenv';
import { Media, MediaType } from '~/constants/enum';
config();

class MediasService {
  constructor() {}

  async handleUploadImage(req: Request) {
    sharp.cache(false);
    const filesUploaded = await handleUploadImage(req);
    const result: Media[] = await Promise.all(
      filesUploaded.map(async (fileUploaded) => {
        const newPath = path.resolve('uploads/images') + `/${fileUploaded.newFilename.split('.')[0]}.jpg`;
        const info = await sharp(fileUploaded.filepath).jpeg({ quality: 90 });
        info.toFile(newPath, (err, ifo) => {
          fs.remove(fileUploaded.filepath).catch((err) => console.log(err));
        });
        return {
          url: isProduction
            ? `${process.env.HOST}/image/${fileUploaded.newFilename.split('.')[0]}.jpg`
            : `http://localhost:${process.env.PORT}/image/${fileUploaded.newFilename.split('.')[0]}.jpg`,
          type: MediaType.Image
        };
      })
    );
    return result;
  }

  async handleUploadVideo(req: Request) {
    sharp.cache(false);
    const filesUploaded = await handleUploadVideo(req);
    return filesUploaded[0].newFilename;
    // const result: Media[] = await Promise.all(
    //   filesUploaded.map(async (fileUploaded) => {
    //     const newPath = path.resolve('uploads/images') + `/${fileUploaded.newFilename.split('.')[0]}.jpg`;

    //     const info = await sharp(fileUploaded.filepath).jpeg({ quality: 90 });
    //     info.toFile(newPath, (err, ifo) => {
    //       fs.remove(fileUploaded.filepath).catch((err) => console.log(err));
    //     });
    //     return {
    //       url: isProduction
    //         ? `${process.env.HOST}/${fileUploaded.newFilename.split('.')[0]}.jpg`
    //         : `http://localhost:${process.env.PORT}/${fileUploaded.newFilename.split('.')[0]}.jpg`,
    //       type: MediaType.Image
    //     };
    //   })
    // );
    // return result;
  }
}

const mediasService = new MediasService();
export default mediasService;
