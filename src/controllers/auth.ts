import { signupSchema } from '@auth/schemes/signup';
import { createAuthUser, getAuthUserById, getAuthUserByVerificationToken, getUserByEmail, getUserByUsername, signToken, updateVerifyEmailField } from '@auth/services/auth.service';
import { BadRequestError, IAuthDocument, IEmailMessageDetails, firstLetterUppercase, isEmail, uploadFile } from '@hansin91/jobber-shared';
import { CloudinaryUpload } from '@hansin91/jobber-shared/src/cloudinary-upload';
import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import { v4 as uuidV4 } from 'uuid';
import { config } from '@auth/config';
import { DirectMessage, publishDirectMessage } from '@auth/queues/auth.producer';
import { authChannel } from '@auth/server';
import { StatusCodes } from 'http-status-codes';
import { signinSchema } from '@auth/schemes/signin';
import { AuthModel } from '@auth/models/auth.schema';
import { omit } from 'lodash';
import { ObjectSchema } from 'joi';
import { generateRandomCharacters } from '@auth/helpers';
import { checkIfUserExists } from '@auth/validators';

class AuthController {

  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username } = req.params;
      const existingUser: IAuthDocument = await getUserByUsername(username);
      const userJWT: string = this.signUserToken(existingUser);
      res.status(StatusCodes.OK).json({ message: 'Refresh token', user: existingUser, token: userJWT });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;
      const checkIfUserExist: IAuthDocument = await getAuthUserByVerificationToken(token);
      if (!checkIfUserExist) {
        throw new BadRequestError('Verification token is either invalid or is already used.', 'VerifyEmail update() method error');
      }
      await updateVerifyEmailField(checkIfUserExist.uuid!, 1, '');
      const updatedUser = await getAuthUserById(checkIfUserExist.uuid!);
      res.status(StatusCodes.OK).json({ message: 'Email has been verified successfully.', user: updatedUser });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error });
    }
  };

  public signIn = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.validateRequest(req);
      const { username, password } = req.body;
      const isValidEmail: boolean = isEmail(username);
      const existingUser: IAuthDocument = !isValidEmail ? await getUserByUsername(username) : await getUserByEmail(username);
      if (!existingUser) {
        throw new BadRequestError('Invalid username or password', 'SignIn read() method error');
      }
      const passwordMatch: boolean = await AuthModel.prototype.comparePassword(password, existingUser.password);
      if (!passwordMatch) {
        throw new BadRequestError('Invalid username or password', 'SignIn read() method error');
      }
      const userJWT: string = this.signUserToken(existingUser);
      const userData: IAuthDocument = omit(existingUser, ['password']);
      res.status(StatusCodes.OK).json({ message: 'User login successfully', user: userData, token: userJWT });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error });
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.validateRequest(req);

      const { username, email, password, country, profilePicture } = req.body;
      await checkIfUserExists(username, email);

      const profilePublicId = uuidV4();
      const uploadResult = await this.uploadProfilePicture(profilePicture, profilePublicId);

      const authData = this.buildAuthData(username, email, password, country, uploadResult.secure_url, profilePublicId);
      const result = await this.createUser(authData);

      await this.sendVerificationEmail(result);

      const userJWT = this.signUserToken(result);
      res.status(StatusCodes.CREATED).json({ message: 'User created successfully', user: result, token: userJWT });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.BAD_REQUEST).json({ error });
    }
  };

  private validateRequest = async (req: Request): Promise<void> => {
    const { action } = req.body;
    const schema: ObjectSchema = action === 'signup' ? signupSchema : signinSchema;
    const { error } = await Promise.resolve(schema.validate(req.body));
    if (error?.details) {
      const errorMessage = action === 'signup' ? 'SignUp create()' : 'Signin read()';
      throw new BadRequestError(error.details[0].message, `${errorMessage} method error`);
    }
  };

  private uploadProfilePicture = async (profilePicture: string, profilePublicId: string): Promise<UploadApiResponse> => {
    const cloudinaryPayload: CloudinaryUpload = {
      file: profilePicture,
      public_id: profilePublicId,
      overwrite: true,
      invalidate: true
    };
    const uploadResult = await uploadFile(cloudinaryPayload) as UploadApiResponse;
    if (!uploadResult.public_id) {
      throw new BadRequestError('File upload failed. Try again', 'SignUp create() method error');
    }
    return uploadResult;
  };

  private buildAuthData = (
    username: string,
    email: string,
    password: string,
    country: string,
    profilePictureUrl: string,
    profilePublicId: string
  ): IAuthDocument => {
    return {
      username: firstLetterUppercase(username),
      email,
      profilePublicId,
      password,
      country,
      profilePicture: profilePictureUrl,
      emailVerificationToken: generateRandomCharacters(),
    } as IAuthDocument;
  };

  private createUser = async (authData: IAuthDocument): Promise<IAuthDocument> => {
    return createAuthUser(authData);
  };

  private sendVerificationEmail = async (result: IAuthDocument): Promise<void> => {
    const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=${result.emailVerificationToken}`;
    const messageDetails: IEmailMessageDetails = {
      receiverEmail: result.email,
      verifyLink: verificationLink,
      template: 'verifyEmail'
    };
    const payload: DirectMessage = {
      channel: authChannel,
      exchangeName: 'jobber-email-notification',
      routingKey: 'auth-email',
      message: JSON.stringify(messageDetails),
      logMessage: 'Email verification has been sent to notification service'
    };
    await publishDirectMessage(payload);
  };

  private signUserToken = (result: IAuthDocument): string => {
    return signToken(result.uuid!, result.email!, result.username!);
  };
}
export const authController = new AuthController();