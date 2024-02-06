import { faker } from '@faker-js/faker';
import { IAuthDocument, firstLetterUppercase } from '@hansin91/jobber-shared';
import { Request, Response } from 'express';
import { generateUsername } from 'unique-username-generator';
import { v4 as uuidV4 } from 'uuid';
import { generateRandomCharacters } from '@auth/helpers';
import { checkIfUserExists } from '@auth/validators';
import { sample } from 'lodash';
import { createAuthUser } from '@auth/services/auth.service';
import { StatusCodes } from 'http-status-codes';

class SeedController {

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { count } = req.params;
      const usernames: string[] = [];
      for (let i =0; i < parseInt(count, 10); i++) {
        const username:string = generateUsername('',0, 12);
        usernames.push(firstLetterUppercase(username));
      }

      for (let i =0; i < usernames.length; i++) {
        const username = usernames[i];
        const email = faker.internet.email();
        const password = 'supersecure';
        const country = faker.location.country();
        const profilePicture = faker.image.urlPicsumPhotos();
        await checkIfUserExists(username, email);

        const profilePublicId = uuidV4();
        const randomCharacters = generateRandomCharacters();

        const authData: IAuthDocument = {
          username,
          email,
          profilePublicId,
          password,
          country,
          profilePicture,
          emailVerificationToken: randomCharacters,
          emailVerified: sample([0,1])
        } as IAuthDocument;
        await createAuthUser(authData);
      }
      res.status(StatusCodes.OK).json({ message: 'Seed users created successfully '});
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error });
    }
  };
}

export const seedController: SeedController = new SeedController();