import {
  AddUsersToCircleRequest,
  ChangePasswordRequest,
  FollowRequest,
  ForgotPasswordRequest,
  GetMeRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResendVerifyEmailRequest,
  ResetPasswordRequest,
  UnfollowRequest,
  UpdateMeRequest,
  VerifyEmailRequest
} from '~/models/requests/UserRequests';
import bcrypt from 'bcrypt';
import User from '~/models/schemas/UserSchema';
import db from '~/services/databaseServices';
import { signToken, verifyToken } from '~/utils/jwt';
import { SendEmail, TokenType, UserVerifyStatus } from '~/constants/enum';
import { ErrorWithStatus } from '~/models/Errors';
import { RefreshToken } from '~/models/schemas/RefreshTokenSchema';
import { ObjectId } from 'mongodb';
import { JwtPayload } from 'jsonwebtoken';
import { httpStatus } from '~/constants/httpStatus';
import Follower from '~/models/schemas/FollowerSchema';
import { sendVerifyEmail } from '~/utils/email';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { env } from '~/constants/config';

class UsersService {
  constructor() {}
  signAccessToken(userId: string, verify: UserVerifyStatus) {
    return signToken(
      {
        payload: {
          userId,
          type: TokenType.AccessToken,
          verify
        }
      },
      {
        expiresIn: env.accessTokenExpiresIn
      }
    );
  }

  signRefreshToken(userId: string, verify: UserVerifyStatus, expiresIn?: number) {
    return signToken(
      {
        payload: {
          userId,
          type: TokenType.RefreshToken,
          verify
        }
      },
      {
        expiresIn: expiresIn || env.refreshTokenExporesIn
      }
    );
  }

  signEmailVerifyToken(userId: string) {
    return signToken({
      payload: {
        userId,
        type: TokenType.VerifyEmailToken
      }
    });
  }

  signForgotPasswordToken(userId: string) {
    return signToken({
      payload: {
        userId,
        type: TokenType.FogotPasswordToken
      }
    });
  }

  async login(payload: LoginRequest) {
    const user = await db.users.findOne({ email: payload.email });
    if (!user) {
      throw new ErrorWithStatus({
        status: 401,
        message: 'Email not found'
      });
    } else {
      const checkPassword = await bcrypt.compareSync(payload.password, user.password);
      if (checkPassword) {
        const [accessToken, refreshToken] = await Promise.all([
          this.signAccessToken(user._id.toString(), user.verify),
          this.signRefreshToken(user._id.toString(), user.verify)
        ]);

        const saveRefreshToken = await db.refreshTokens.insertOne(
          new RefreshToken({
            token: refreshToken,
            created_at: new Date(),
            user_id: user._id
          })
        );

        return {
          accessToken,
          refreshToken
        };
      } else {
        throw new ErrorWithStatus({
          status: 401,
          message: 'Password incorrect'
        });
      }
    }
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: env.googleClientID,
      client_secret: env.googleClientSecret,
      redirect_uri: env.googleRedirectURI,
      grant_type: 'authorization_code'
    };
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return data;
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    });
    return data;
  }

  async loginGoogle(code: string) {
    const oauthGoogleToken = await this.getOauthGoogleToken(code);
    const googleUserInfo = await this.getGoogleUserInfo(oauthGoogleToken.access_token, oauthGoogleToken.id_token);
    if (!googleUserInfo.verified_email) {
      throw new ErrorWithStatus({
        message: 'Email not verified',
        status: httpStatus.BAD_REQUEST
      });
    }

    const userInDb = await this.checkEmailExists(googleUserInfo.email);

    if (userInDb) {
      const [accessToken, refreshToken] = await Promise.all([
        this.signAccessToken(userInDb._id.toString(), userInDb.verify),
        this.signRefreshToken(userInDb._id.toString(), userInDb.verify)
      ]);
      await db.refreshTokens.insertOne(
        new RefreshToken({
          token: refreshToken,
          created_at: new Date(),
          user_id: userInDb._id
        })
      );
      return {
        accessToken,
        refreshToken,
        newUser: false
      };
    } else {
      const randomPassword = nanoid(10);
      const usernameRandom = googleUserInfo.name.replace(/\s/g, '') + new Date().getTime() + nanoid(5);
      const { accessToken, refreshToken } = await this.register({
        name: googleUserInfo.name,
        email: googleUserInfo.email,
        password: randomPassword,
        confirmPassword: randomPassword,
        username: usernameRandom,
        date_of_birth: new Date().toISOString()
      });
      return {
        accessToken,
        refreshToken,
        newUser: true
      };
    }
  }

  async register(payload: RegisterRequest) {
    const saltRounds = 10;
    payload.password = await bcrypt.hashSync(payload.password, saltRounds);

    const result = await db.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth)
      })
    );
    const userId = result.insertedId.toString();
    const [accessToken, refreshToken, emailVerifyToken] = await Promise.all([
      this.signAccessToken(userId, UserVerifyStatus.Unverified),
      this.signRefreshToken(userId, UserVerifyStatus.Unverified),
      this.signEmailVerifyToken(userId)
    ]);
    const saveRefreshToken = await db.refreshTokens.insertOne(
      new RefreshToken({
        token: refreshToken,
        created_at: new Date(),
        user_id: result.insertedId
      })
    );

    const saveEmailVerifyToken = await db.users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { emailVerifyToken: emailVerifyToken } }
    );
    await sendVerifyEmail(payload.email, emailVerifyToken, SendEmail.VerifyEmail);
    return {
      accessToken,
      refreshToken
    };
  }

  async refreshToken(payload: RefreshTokenRequest) {
    const oldToken = await db.refreshTokens.deleteOne({ token: payload.refreshToken });
    const refreshTokenEXP = (payload.decodeRefreshToken.exp as number) - Math.floor(Date.now() / 1000);
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload.decodeRefreshToken.payload.userId, payload.decodeRefreshToken.payload.verify),
      this.signRefreshToken(
        payload.decodeRefreshToken.payload.userId,
        payload.decodeRefreshToken.payload.verify,
        refreshTokenEXP
      )
    ]);

    const saveRefreshToken = await db.refreshTokens.insertOne(
      new RefreshToken({
        token: refreshToken,
        created_at: new Date(),
        user_id: new ObjectId(payload.decodeRefreshToken.payload.userId)
      })
    );

    return {
      accessToken,
      refreshToken
    };
  }

  async checkEmailExists(email: string) {
    const user = await db.users.findOne({ email });
    if (user) {
      return user;
    } else return false;
  }

  async checkUsernameExists(username: string) {
    const user = await db.users.findOne({ username });
    if (user) {
      return user;
    } else return false;
  }

  async checkUserIdExists(userId: string) {
    const user = await db.users.findOne({ _id: new ObjectId(userId) });
    if (user) {
      return user;
    } else return false;
  }

  async logout(payload: LogoutRequest) {
    const deleteRefresh = await db.refreshTokens.deleteOne({ token: payload.refreshToken });
    return;
  }

  async verifyEmail(payload: VerifyEmailRequest) {
    const userId = payload.decodeEmailVerifyToken.payload.userId;
    const user = await db.users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'User not found'
      });
    } else {
      if (user.emailVerifyToken === '') {
        throw new ErrorWithStatus({
          status: 400,
          message: 'User is verified'
        });
      }
      if (user.emailVerifyToken !== payload.emailVerifyToken) {
        throw new ErrorWithStatus({
          status: 400,
          message: 'Email verify token is not match'
        });
      }
      await db.users.updateOne({ _id: new ObjectId(userId) }, [
        { $set: { verify: UserVerifyStatus.Verified, emailVerifyToken: '', updated_at: '$$NOW' } }
      ]);
      return;
    }
  }

  async resendVerifyEmail(payload: ResendVerifyEmailRequest) {
    const userId = payload.decodeAuthorization.payload.userId;
    const user = await db.users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new ErrorWithStatus({
        status: httpStatus.NOT_FOUND,
        message: 'User not found'
      });
    }
    if (user.verify === UserVerifyStatus.Verified) {
      throw new ErrorWithStatus({
        status: httpStatus.OK,
        message: 'Verified'
      });
    }

    const emailVerifyToken = await this.signEmailVerifyToken(userId);
    const save = await db.users.updateOne({ _id: new ObjectId(userId) }, [
      {
        $set: { emailVerifyToken, updated_at: '$$NOW' }
      }
    ]);
    await sendVerifyEmail(user.email, emailVerifyToken, SendEmail.VerifyEmail);
    return;
  }

  async forgotPassword(payload: ForgotPasswordRequest) {
    const forgotPasswordToken = await this.signForgotPasswordToken(payload.user._id.toString());
    const save = await db.users.updateOne({ _id: payload.user._id }, [
      {
        $set: { forgotPasswordToken, updated_at: '$$NOW' }
      }
    ]);
    await sendVerifyEmail(payload.user.email, forgotPasswordToken, SendEmail.FogotPassword);
    return;
  }

  async resetPassword(payload: ResetPasswordRequest) {
    const saltRounds = 10;
    const password = await bcrypt.hashSync(payload.password, saltRounds);
    const save = await db.users.updateOne(
      { _id: payload.user._id },
      {
        $set: { password, forgotPasswordToken: '', updated_at: new Date() }
      }
    );
    return;
  }

  async getMe(payload: GetMeRequest) {
    const userId = payload.decodeAuthorization.payload.userId;
    const user = await db.users.findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          password: 0,
          emailVerifyToken: 0,
          forgotPasswordToken: 0
        }
      }
    );
    return user;
  }

  async updateMe(payload: UpdateMeRequest) {
    const userId = payload.decodeAuthorization.payload.userId;
    const { decodeAuthorization, ...payloadWithOutJWT } = payload;
    const newPayload = payload.date_of_birth
      ? { ...payloadWithOutJWT, date_of_birth: new Date(payload.date_of_birth) }
      : payloadWithOutJWT;
    const user = await db.users.findOneAndUpdate(
      {
        _id: new ObjectId(userId)
      },
      {
        $set: {
          ...(newPayload as UpdateMeRequest & { date_of_birth: Date })
        }
      },
      {
        returnDocument: 'after',
        projection: {
          emailVerifyToken: 0,
          forgotPasswordToken: 0,
          password: 0
        }
      }
    );
    return user;
  }

  async follow(payload: FollowRequest) {
    const userId = payload.decodeAuthorization.payload.userId;
    const followedUserId = new ObjectId(payload.userId);
    const result = await db.followers.insertOne(
      new Follower({
        user_id: userId,
        followed_user_id: followedUserId,
        created_at: new Date()
      })
    );
  }

  async unfollow(payload: UnfollowRequest) {
    const userId = payload.decodeAuthorization.payload.userId;
    const followedUserId = new ObjectId(payload.userId);
    const result = await db.followers.deleteOne({
      user_id: userId,
      followed_user_id: followedUserId
    });
    if (result.deletedCount === 0) {
      throw new ErrorWithStatus({
        message: 'This user is not followed yet',
        status: httpStatus.NOT_FOUND
      });
    }
    return result;
  }

  async changePassword(payload: ChangePasswordRequest) {
    const userId = payload.decodeAuthorization.payload.userId;
    const oldPassword = payload.oldPassword;
    const newPassword = payload.newPassword;

    const user = await db.users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new ErrorWithStatus({
        message: 'User not found',
        status: httpStatus.NOT_FOUND
      });
    }
    const checkPassword = await bcrypt.compareSync(oldPassword, user.password);
    if (!checkPassword) {
      throw new ErrorWithStatus({
        message: 'Password incorrect',
        status: httpStatus.UNAUTHORIZED
      });
    } else {
      const saltRounds = 10;
      const password = await bcrypt.hashSync(newPassword, saltRounds);
      const save = await db.users.findOneAndUpdate(
        {
          _id: new ObjectId(userId)
        },
        {
          $set: {
            password
          }
        }
      );
      return;
    }
  }

  async setUserCircle(payload: AddUsersToCircleRequest) {
    const userIds = payload.userIds.map((userId) => new ObjectId(userId));
    const changeCircle = await db.users.findOneAndUpdate(
      { _id: new ObjectId(payload.decodeAuthorization.payload.userId) },
      { $set: { twitter_circle: userIds } },
      { returnDocument: 'after' }
    );
  }
}

const usersService = new UsersService();
export default usersService;
