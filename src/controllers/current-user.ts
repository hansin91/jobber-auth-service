import { config } from '@auth/config';
import { generateRandomCharacters } from '@auth/helpers';
import { DirectMessage, publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { getAuthUserById, getUserByEmail, updateVerifyEmailField } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, IEmailMessageDetails } from '@hansin91/jobber-shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

class CurrentUserController {
  public read = async (req: Request, res: Response): Promise<void> => {
    try {
      let user = null;
      const existingUser: IAuthDocument = await getAuthUserById(req.currentUser!.uuid);
      if (Object.keys(existingUser).length) {
        user = existingUser;
      }
      res.status(StatusCodes.OK).json({ message: 'Authenticated user', user });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
    }
  };

  public resendEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, userId } = req.body;
      const checkIfUserExist: IAuthDocument = await getUserByEmail(email);
      if (!checkIfUserExist) {
        throw new BadRequestError('Email is invalid', 'CurrentUser resendEmail() method error');
      }
      const randomCharacters = generateRandomCharacters();
      const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=${randomCharacters}`;
      await updateVerifyEmailField(userId, 0, randomCharacters);
      const messageDetails: IEmailMessageDetails = {
        receiverEmail: email,
        verifyLink: verificationLink,
        template: 'verifyEmail'
      };
      const directMessage: DirectMessage = {
        channel: authChannel,
        exchangeName: 'jobber-email-notification',
        routingKey: 'auth-email',
        message: JSON.stringify(messageDetails),
        logMessage: 'Verify email message has been sent to notification service'
      };
      await publishDirectMessage(directMessage);
      const updatedUser = await getAuthUserById(userId);
      res.status(StatusCodes.OK).json({ message: 'Email verification sent', user: updatedUser });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
    }
  };
}

export const currentUserController: CurrentUserController = new CurrentUserController();