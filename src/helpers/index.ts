import crypto from 'crypto';

export const generateRandomCharacters = () => {
  const randomBytes: Buffer = crypto.randomBytes(20);
  const randomCharacters: string = randomBytes.toString('hex');
  return randomCharacters;
};
