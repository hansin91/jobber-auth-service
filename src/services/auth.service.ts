import { config } from '@auth/config';
import { AuthModel } from '@auth/models/auth.schema';
import { DirectMessage, publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { IAuthBuyerMessageDetails, IAuthDocument, firstLetterUppercase } from '@hansin91/jobber-shared';
import { sign } from 'jsonwebtoken';
import { omit } from 'lodash';
import { Model, Op } from 'sequelize';

export const createAuthUser = async (data: IAuthDocument): Promise<IAuthDocument> => {
  const result: Model = await AuthModel.create(data);
  const { username, email, profilePicture, country, createdAt } = result.dataValues;
  const messageDetails: IAuthBuyerMessageDetails = {
    username,
    email,
    profilePicture,
    country,
    createdAt,
    type: 'auth'
  };

  const directMessagePayload: DirectMessage = {
    channel: authChannel,
    exchangeName: 'jobber-buyer-update',
    routingKey: 'user-buyer',
    message: JSON.stringify(messageDetails),
    logMessage: 'Buyer details sent to buyer service'
  };

  await publishDirectMessage(directMessagePayload);
  const userData: IAuthDocument = omit(result.dataValues, ['password']) as IAuthDocument;
  return userData;
};

export const getAuthUserById = async (authId: string): Promise<IAuthDocument> => {
  const user: Model<IAuthDocument> = await AuthModel.findOne({
    where: { uuid: authId },
    attributes: {
      exclude: ['password']
    }
  }) as Model;
  return user?.dataValues;
};

export const getUserByUsernameOrEmail = async (username: string, email: string): Promise<IAuthDocument> => {
  const user: Model<IAuthDocument> = await AuthModel.findOne({
    where: {
      [Op.or]: [
        { username },
        { email }
      ]
    },
    attributes: {
      exclude: ['password']
    }
  }) as Model;
  return user?.dataValues;
};

export const getUserByUsername = async (username: string): Promise<IAuthDocument> => {
  const user: Model<IAuthDocument> = await AuthModel.findOne({
    where: { username: firstLetterUppercase(username) },
  }) as Model;
  return user?.dataValues;
};

export const getUserByEmail = async (email: string): Promise<IAuthDocument> => {
  const user: Model<IAuthDocument> = await AuthModel.findOne({
    where: { email },
  }) as Model;
  return user?.dataValues;
};

export const getAuthUserByVerificationToken = async (token: string): Promise<IAuthDocument> => {
  const user: Model<IAuthDocument> = await AuthModel.findOne({
    where: { emailVerificationToken: token },
    attributes: {
      exclude: ['password']
    }
  }) as Model;
  return user.dataValues;
};

export const getAuthUserByPasswordToken = async (token: string): Promise<IAuthDocument> => {
  const user: Model<IAuthDocument> = await AuthModel.findOne({
    where: {
      [Op.and]: [
        { passwordResetToken: token },
        { passwordResetExpires: { [Op.gt]: new Date() }}
      ]
    },
    attributes: {
      exclude: ['password']
    }
  }) as Model;
  return user.dataValues;
};

export const updateVerifyEmailField = async (authId: string, emailVerified: number, emailVerificationToken: string): Promise<void> => {
  await AuthModel.update(
    {
      emailVerified,
      emailVerificationToken
    },
    { where: { uuid: authId }}
  );
};

export const updatePasswordToken = async (authId: string, token: string, tokenExpiration: Date): Promise<void> => {
  await AuthModel.update(
    {
      passwordResetToken: token,
      passwordResetExpires: tokenExpiration,
    },
    { where: { uuid: authId }}
  );
};

export const updatePassword = async (authId: string, password: string): Promise<void> => {
  await AuthModel.update(
    {
      password,
      passwordResetToken: '',
      passwordResetExpires: new Date(),
    },
    { where: { uuid: authId }}
  );
};

export const signToken = (uuid: string, email: string, username: string): string => {
  return sign({ id: uuid, email, username}, config.JWT_TOKEN);
};