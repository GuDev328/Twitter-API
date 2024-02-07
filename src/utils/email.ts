/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import fs from 'fs';
import path from 'path';
import { env } from '~/constants/config';
import { SendEmail } from '~/constants/enum';

// Create SES service object.
const sesClient = new SESClient({
  region: env.AWSRegion,
  credentials: {
    secretAccessKey: env.AWSSecretAccessKey,
    accessKeyId: env.AWSAccessKeyID
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
    subject = env.subjectEmailVerifyEmail as string;
    body = tempalte
      .replace('{{title}}', env.titleEmailVerifyEmail as string)
      .replace('{{content}}', env.contentEmailVerifyEmail as string)
      .replace('{{verifyLink}}', env.host + '/verify-email?token=' + token);
  } else if (type === SendEmail.FogotPassword) {
    subject = env.subjectEmailForgotPassword as string;
    body = tempalte
      .replace('{{title}}', env.titleEmailForgotPassword as string)
      .replace('{{content}}', env.contentEmailForgotPassword as string)
      .replace('{{verifyLink}}', env.host + '/forgot-password?token=' + token);
  }

  const sendEmailCommand = createSendEmailCommand({
    fromAddress: env.SESFromAddress as string,
    toAddresses: toAddress,
    body,
    subject
  });
  await sesClient.send(sendEmailCommand);
  return;
};
