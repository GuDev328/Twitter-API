import { Request } from 'express';
import path from 'path';
import sharp from 'sharp';
import db from '~/services/databaseServices';
import { handleUploadSingleImage } from '~/utils/file';
import fs from 'fs-extra';

class MediasService {
  constructor() {}

  async handleUploadSingleImage(req: Request) {
    sharp.cache(false);
    const fileUploaded = await handleUploadSingleImage(req);
    const newPath = path.resolve('uploads') + `/${fileUploaded.newFilename.split('.')[0]}.jpg`;
    const info = await sharp(fileUploaded.filepath).jpeg({ quality: 90 });
    info.toFile(newPath, (err, ifo) => {
      fs.remove(fileUploaded.filepath).catch((err) => console.log(err));
    });
    return `https://localhost:3030/uploads/${fileUploaded.newFilename.split('.')[0]}.jpg`;
  }
}

const mediasService = new MediasService();
export default mediasService;
