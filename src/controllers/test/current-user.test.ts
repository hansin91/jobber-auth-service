import { Request, Response } from 'express';
import * as auth from '@auth/services/auth.service';
import * as helper from '@hansin91/jobber-shared';

import { currentUserController } from '../current-user';

import { authMock, authMockRequest, authMockResponse, authUserPayload, IAuthMockRequest } from './mocks/auth.mock';


jest.mock('@auth/services/auth.service');
jest.mock('@hansin91/jobber-shared');
jest.mock('@auth/queues/auth.producer');
jest.mock('@elastic/elasticsearch');

const USERNAME = 'Manny';
const PASSWORD = 'secure1';

describe('CurrentUser', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('read method', () => {
    it('should return authenticated user', async () => {
      const payload: IAuthMockRequest = {
        sessionData: {},
        body: { username: USERNAME, password: PASSWORD },
        currentUser: authUserPayload
      };
      const req: Request = authMockRequest(payload) as unknown as Request;
      const res: Response = authMockResponse();
      jest.spyOn(auth, 'getAuthUserById').mockResolvedValue(authMock);
      await currentUserController.read(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authenticated user',
        user: authMock
      });
    });

    it('should return empty user', async () => {
      const payload: IAuthMockRequest = {
        sessionData: {},
        body: { username: USERNAME, password: PASSWORD },
        currentUser: authUserPayload
      };
      const req: Request = authMockRequest(payload) as unknown as Request;
      const res: Response = authMockResponse();
      jest.spyOn(auth, 'getAuthUserById').mockResolvedValue({} as never);
      await currentUserController.read(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authenticated user',
        user: null
      });
    });

  });

  describe('resendEmail method', () => {
    it('should call BadRequestError for invalid email', async () => {
      const payload: IAuthMockRequest = {
        sessionData: {},
        body: { username: USERNAME, password: PASSWORD },
        currentUser: authUserPayload
      };
      const req: Request = authMockRequest(payload) as unknown as Request;
      const res: Response = authMockResponse();
      jest.spyOn(auth, 'getUserByEmail').mockResolvedValue({} as never);
      currentUserController.resendEmail(req, res).catch(() => {
        expect(helper.BadRequestError).toHaveBeenCalledWith('Email is invalid', 'CurrentUser resendEmail() method error');
      });
    });

    it('should call updateVerifyEmailField method', async () => {
      const payload: IAuthMockRequest = {
        sessionData: {},
        body: { username: USERNAME, password: PASSWORD },
        currentUser: authUserPayload
      };
      const req: Request = authMockRequest(payload) as unknown as Request;
      const res: Response = authMockResponse();
      jest.spyOn(auth, 'getUserByEmail').mockResolvedValue(authMock);
      await currentUserController.resendEmail(req, res);
      expect(auth.updateVerifyEmailField).toHaveBeenCalled();
    });

    it('should return authenticated user', async () => {
      const payload: IAuthMockRequest = {
        sessionData: {},
        body: { username: USERNAME, password: PASSWORD },
        currentUser: authUserPayload
      };
      const req: Request = authMockRequest(payload) as unknown as Request;
      const res: Response = authMockResponse();
      jest.spyOn(auth, 'getUserByEmail').mockResolvedValue(authMock);
      jest.spyOn(auth, 'getAuthUserById').mockResolvedValue(authMock);

      await currentUserController.resendEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email verification sent',
        user: authMock
      });
    });

  });
});

