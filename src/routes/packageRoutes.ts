import { Router } from 'express';
import { getPackages, getPackageRating } from '../controllers/packageController';

const router = Router();

// Define your routes
router.get('/packages', getPackages);
router.get('/package/:id/rate', getPackageRating);

export default router;
