import { changePasswordSchema, emailSchema, passwordSchema } from '@auth/schemes/password';
import { getAuthUserByPasswordToken, getUserByEmail, getUserByUsername, updatePassword, updatePasswordToken } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, IEmailMessageDetails } from '@hansin91/jobber-shared';
import { Request, Response } from 'express';
import { config } from '@auth/config';
import { DirectMessage, publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { StatusCodes } from 'http-status-codes';
import { AuthModel } from '@auth/models/auth.schema';
import { ObjectSchema } from 'joi';
import { generateRandomCharacters } from '@auth/helpers';

class PasswordController {

  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.validateRequest(req);
      const { currentPassword, newPassword } = req.body;
      if (currentPassword === newPassword) {
        throw new BadRequestError('New password cannot be same as old password', 'Password changePassword() method error');
      }

      const existingUser: IAuthDocument = await getUserByUsername(`${req.currentUser?.username}`);
      if (!existingUser) {
        throw new BadRequestError('Invalid password', 'Password changePassword() method error');
      }
      const hashedPassword: string = await AuthModel.prototype.hashPassword(newPassword);
      await updatePassword(existingUser.uuid!, hashedPassword);
      const messageDetails: IEmailMessageDetails = {
        username: existingUser.username,
        template: 'resetPasswordSuccess'
      };
      const directMessage: DirectMessage = {
        channel: authChannel,
        exchangeName: 'jobber-email-notification',
        routingKey: 'auth-email',
        message: JSON.stringify(messageDetails),
        logMessage: 'Change password message sent to notification service'
      };
      await publishDirectMessage(directMessage);
      res.status(StatusCodes.OK).json({ message: 'Password successfully updated.'});
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error });
    }
  };

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.validateRequest(req);
      const { password, confirmPassword } = req.body;
      const { token } = req.params;
      if (password !== confirmPassword) {
        throw new BadRequestError('Passwords do not match', 'Password resetPassword() method error');
      }

      const existingUser: IAuthDocument = await getAuthUserByPasswordToken(token);
      if (!existingUser) {
        throw new BadRequestError('Token has been expired', 'Password resetPassword() method error');
      }
      const hashedPassword: string = await AuthModel.prototype.hashPassword(password);
      await updatePassword(existingUser.uuid!, hashedPassword);
      const messageDetails: IEmailMessageDetails = {
        username: existingUser.username,
        template: 'resetPasswordSuccess'
      };
      const directMessage: DirectMessage = {
        channel: authChannel,
        exchangeName: 'jobber-email-notification',
        routingKey: 'auth-email',
        message: JSON.stringify(messageDetails),
        logMessage: 'Reset password message sent to notification service'
      };
      await publishDirectMessage(directMessage);
      res.status(StatusCodes.OK).json({ message: 'Password successfully updated.'});
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error });
    }
  };

  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.validateRequest(req);
      const { email } = req.body;
      const existingUser: IAuthDocument = await getUserByEmail(email);
      if (!existingUser) {
        throw new BadRequestError('Invalid email', 'Password create() method error');
      }
      const token = generateRandomCharacters();
      const expirationDate = this.calculateExpirationDate();
      await updatePasswordToken(existingUser.uuid!, token, expirationDate);

      const resetLink = `${config.CLIENT_URL}/reset_password?token=${token}`;
      const messageDetails = this.buildEmailMessageDetails(existingUser, resetLink);

      await this.sendEmailNotification(messageDetails);
      res.status(StatusCodes.OK).json({ message: 'Password reset email sent' });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error });
    }
  };

  private sendEmailNotification = async (messageDetails: IEmailMessageDetails): Promise<void> => {
    const directMessage: DirectMessage = {
      channel: authChannel,
      exchangeName: 'jobber-email-notification',
      routingKey: 'auth-email',
      message: JSON.stringify(messageDetails),
      logMessage: 'Forgot password message sent to notification service'
    };
    await publishDirectMessage(directMessage);
  };

  private buildEmailMessageDetails = (user: IAuthDocument, resetLink: string): IEmailMessageDetails => {
    return {
      receiverEmail: user.email,
      resetLink,
      username: user.username,
      template: 'forgotPassword'
    };
  };

  private validateRequest = async (req: Request): Promise<void> => {
    const { action } = req.body;
    const schema: ObjectSchema = action === 'forgotPassword' ? emailSchema :
                                 action === 'resetPassword' ? passwordSchema : changePasswordSchema;
    const { error } = await Promise.resolve(schema.validate(req.body));
    const errorMessage =
        action === 'forgotPassword' ? 'Password create()' :
        action === 'resetPassword' ? 'Password resetPassword()' : 'Password changePassword()';
    if (error?.details) {
      throw new BadRequestError(error.details[0].message, `${errorMessage} method error`);
    }
  };

  private calculateExpirationDate = ():Date => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date;
  };
}

export const passwordController: PasswordController = new PasswordController();