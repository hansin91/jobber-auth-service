import { authController } from '@auth/controllers/auth';
import { currentUserController } from '@auth/controllers/current-user';
import express, { Router } from 'express';

const router: Router = express.Router();

export const currentUserRoutes = (): Router => {
  router.get('/refresh-token/:username', authController.refreshToken);
  router.get('/currentuser', currentUserController.read);
  router.post('/resend-email', currentUserController.resendEmail);
  return router;
};
