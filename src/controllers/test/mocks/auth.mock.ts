import { IAuthDocument, IAuthPayload } from '@hansin91/jobber-shared';
import { Response } from 'express';
import { v4 as uuidV4 } from 'uuid';

export const authMockRequest = (request: IAuthMockRequest) => ({
  session: request.sessionData,
  body: request.body,
  currentUser: request.currentUser,
  params: request.params
});

export const authMockResponse = (): Response => {
  const res: Response = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

export interface IAuthMockRequest {
  sessionData: IJWT,
  body: IAuthMock,
  currentUser?: IAuthPayload | null,
  params?: unknown
}

export interface IJWT {
  jwt?: string
}

export interface IAuthMock {
  uuid?: string;
  username?: string;
  email?: string;
  password?: string;
  createdAt?: Date | string;
}

export const authUserPayload: IAuthPayload = {
  uuid: uuidV4(),
  username: 'Manny',
  email: 'manny@test.com',
  iat: 1235282483
};

export const authMock: IAuthDocument = {
  uuid: uuidV4(),
  profilePublicId: '9328749ahdkashdkad324',
  username: 'Manny',
  email: 'manny@test.com',
  country: 'Germany',
  profilePicture: '',
  emailVerified: 1,
  createdAt: '2023-12-19T07:42:24.431Z',
  comparePassword: () => {},
  hashPassword: () => false,
} as unknown as IAuthDocument;
