/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import env from 'dotenv';
import fs from 'fs';
import path from 'path';
import { SendEmail } from '~/constants/enum';

env.config();
// Create SES service object.
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
});

const createSendEmailCommand = ({
  fromAddress,
  toAddresses,
  ccAddresses = [],
  body,
  subject,
  replyToAddresses = []
}: {
  fromAddress: string;
  toAddresses: string | string[];
  ccAddresses?: string | string[];
  body: string;
  subject: string;
  replyToAddresses?: string | string[];
}) => {
  return new SendEmailCommand({
    Destination: {
      /* required */
      CcAddresses: ccAddresses instanceof Array ? ccAddresses : [ccAddresses],
      ToAddresses: toAddresses instanceof Array ? toAddresses : [toAddresses]
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: fromAddress,
    ReplyToAddresses: replyToAddresses instanceof Array ? replyToAddresses : [replyToAddresses]
  });
};

export const sendVerifyEmail = async (toAddress: string | string[], token: string, type: SendEmail) => {
  const tempalte = fs.readFileSync(path.resolve('src/templates/templateVerifyEmail.html'), 'utf8');
  let body = '';
  let subject = '';
  if (type === SendEmail.VerifyEmail) {
    subject = process.env.SUBJECT_EMAIL_VERIFY_EMAIL as string;
    body = tempalte
      .replace('{{title}}', process.env.TITLE_EMAIL_VERIFY_EMAIL as string)
      .replace('{{content}}', process.env.CONTENT_EMAIL_VERIFY_EMAIL as string)
      .replace('{{verifyLink}}', process.env.HOST + '/verify-email?token=' + token);
  } else if (type === SendEmail.FogotPassword) {
    subject = process.env.SUBJECT_EMAIL_FORGOT_PASSWORD as string;
    body = tempalte
      .replace('{{title}}', process.env.TITLE_EMAIL_FORGOT_PASSWORD as string)
      .replace('{{content}}', process.env.CONTENT_EMAIL_FORGOT_PASSWORD as string)
      .replace('{{verifyLink}}', process.env.HOST + '/forgot-password?token=' + token);
  }

  const sendEmailCommand = createSendEmailCommand({
    fromAddress: process.env.SES_FROM_ADDRESS as string,
    toAddresses: toAddress,
    body,
    subject
  });
  await sesClient.send(sendEmailCommand);
  return;
};
