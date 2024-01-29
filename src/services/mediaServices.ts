import { Request } from 'express';
import path from 'path';
import sharp from 'sharp';
import db from '~/services/databaseServices';
import { getFiles, handleUploadImage, handleUploadVideo, handleUploadVideoHLS } from '~/utils/file';
import fs from 'fs-extra';
import { isProduction } from '~/constants/config';
import { config } from 'dotenv';
import { Media, MediaType } from '~/constants/enum';
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video';
import { UploadFileToS3 } from '~/utils/s3';
import { CompleteMultipartUploadOutput } from '@aws-sdk/client-s3';
import mime from 'mime-types';

config();

class Queue {
  items: string[];
  encoding: boolean;
  constructor() {
    (this.items = []), (this.encoding = false);
  }

  enqueue(item: string) {
    this.items.push(item);
    this.processing();
  }
  async processing() {
    if (this.encoding) return;
    if (this.items.length > 0) {
      try {
        this.encoding = true;
        const filePath = this.items[0];
        await encodeHLSWithMultipleVideoStreams(filePath);
        const idName = filePath.split('\\').pop() as string;
        await fs.remove(filePath);
        this.items.shift();
        const files = getFiles(path.resolve('uploads/videos', idName));
        files.map((filePath) => {
          const s3Result = UploadFileToS3(
            'videos-hls/' + idName + filePath.replace(path.resolve('uploads/videos', idName), '').replace('\\', '/'),
            filePath,
            mime.lookup(filePath) as string
          );
        });
        fs.rmdirSync(path.resolve('uploads/videos', idName), { recursive: true });
        this.encoding = false;
        this.processing();
      } catch (e) {
        console.log('Error in processing encode video hls: ' + e);
      }
    }
  }
}

const encodeVideoQueue = new Queue();

class MediasService {
  constructor() {}

  async handleUploadImage(req: Request) {
    sharp.cache(false);
    const filesUploaded = await handleUploadImage(req);
    const result: Media[] = await Promise.all(
      filesUploaded.map(async (fileUploaded) => {
        const newPath = path.resolve('uploads/images') + `\\${fileUploaded.newFilename.split('.')[0]}.jpg`;
        const info = await sharp(fileUploaded.filepath).jpeg({ quality: 90 });
        await info.toFile(newPath);
        const s3Result = await UploadFileToS3(
          'images/' + fileUploaded.newFilename,
          newPath,
          mime.lookup(newPath) as string
        );
        await Promise.all([fs.remove(newPath), fs.remove(fileUploaded.filepath)]);
        return {
          url: (s3Result as CompleteMultipartUploadOutput).Location as string,
          type: MediaType.Image
        };
      })
    );
    return result;
  }

  async handleUploadVideo(req: Request) {
    const filesUploaded = await handleUploadVideo(req);
    const result: Media[] = await Promise.all(
      filesUploaded.map(async (fileUploaded) => {
        const s3Result = await UploadFileToS3(
          'videos/' + fileUploaded.newFilename,
          fileUploaded.filepath,
          mime.lookup(fileUploaded.filepath) as string
        );
        await fs.remove(fileUploaded.filepath);
        return {
          url: (s3Result as CompleteMultipartUploadOutput).Location as string,
          type: MediaType.Video
        };
      })
    );
    return result;
  }

  async handleUploadVideoHLS(req: Request) {
    const filesUploaded = await handleUploadVideoHLS(req);
    const result: Media[] = await Promise.all(
      filesUploaded.map(async (fileUploaded) => {
        encodeVideoQueue.enqueue(fileUploaded.filepath);
        return {
          url: isProduction
            ? `${process.env.HOST}/medias/video-hls/${fileUploaded.newFilename.split('.')[0]}/master.m3u8`
            : `http://localhost:${process.env.PORT}/medias/video-hls/${
                fileUploaded.newFilename.split('.')[0]
              }/master.m3u8`,
          type: MediaType.VideoHLS
        };
      })
    );
    return result;
  }

  async checkStatusEncodeHLSVideo(id: string) {
    const pathFolderVideo = path.resolve('uploads/videos', id);
    if (fs.existsSync(pathFolderVideo)) {
      return 'Processing';
    } else {
      return 'Uploaded';
    }
  }
}

const mediasService = new MediasService();
export default mediasService;
