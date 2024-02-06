import { getUserByUsernameOrEmail } from '@auth/services/auth.service';
import { BadRequestError } from '@hansin91/jobber-shared';

export const checkIfUserExists = async (username: string, email: string): Promise<void> => {
  const checkIfUserExist = await getUserByUsernameOrEmail(username, email);
  if (checkIfUserExist) {
    throw new BadRequestError('Username or email already registered', 'SignUp create() method error');
  }
};