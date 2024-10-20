import { Router } from 'express';
import { getPackages, ratePackage } from '../controllers/packageController';

const router = Router();

// Define your routes
router.get('/packages', getPackages);
router.get('/package/:id/rate', ratePackage);

export default router;
