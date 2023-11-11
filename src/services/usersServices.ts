import {
  ForgotPasswordRequest,
  GetMeRequest,
  LoginRequest,
  LogoutRequest,
  RegisterRequest,
  ResendVerifyEmailRequest,
  ResetPasswordRequest,
  VerifyEmailRequest
} from '~/models/requests/UserRequests';
import bcrypt from 'bcrypt';
import User from '~/models/schemas/UserSchema';
import db from '~/services/databaseServices';
import { signToken, verifyToken } from '~/utils/jwt';
import { TokenType, UserVerifyStatus } from '~/constants/enum';
import { ErrorWithStatus } from '~/models/Errors';
import { RefreshToken } from '~/models/schemas/RefreshTokenSchema';
import { ObjectId } from 'mongodb';
import { JwtPayload } from 'jsonwebtoken';
import { httpStatus } from '~/constants/httpStatus';

class UsersService {
  constructor() {}
  signAccessToken(userId: string) {
    return signToken(
      {
        payload: {
          userId,
          type: TokenType.AccessToken
        }
      },
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    );
  }

  signRefreshToken(userId: string) {
    return signToken(
      {
        payload: {
          userId,
          type: TokenType.RefreshToken
        }
      },
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
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
          this.signAccessToken(user._id.toString()),
          this.signRefreshToken(user._id.toString())
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
      this.signAccessToken(userId),
      this.signRefreshToken(userId),
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
    return;
  }

  async forgotPassword(payload: ForgotPasswordRequest) {
    const forgotPasswordToken = await this.signForgotPasswordToken(payload.user._id.toString());
    const save = await db.users.updateOne({ _id: payload.user._id }, [
      {
        $set: { forgotPasswordToken, updated_at: '$$NOW' }
      }
    ]);
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
}

const usersService = new UsersService();
export default usersService;
