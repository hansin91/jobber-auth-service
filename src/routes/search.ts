import { searchController } from '@auth/controllers/search';
import express, { Router } from 'express';

const router: Router = express.Router();

export const searchRoutes = (): Router => {
  router.get('/search/gig/:from/:size/:type', searchController.gigs);
  router.get('/search/gig/:gigId', searchController.getSingleGigById);
  return router;
};
