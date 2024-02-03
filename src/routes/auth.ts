import { authController } from '@auth/controllers/auth';
import { passwordController } from '@auth/controllers/password';
import express, { Router } from 'express';

const router: Router = express.Router();

export const authRoutes = (): Router => {
  router.post('/signup', authController.create);
  router.post('/signin', authController.signIn);
  router.put('/verify-email', authController.update);
  router.put('/forgot-password', passwordController.forgotPassword);
  router.put('/reset-password/:token', passwordController.resetPassword);
  router.put('/change-password', passwordController.changePassword);
  return router;
};
