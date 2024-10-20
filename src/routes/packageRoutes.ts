import { Router } from 'express';
import { getPackages, ratePackage } from '../controllers/packageController';

const router = Router();

// Define your routes
router.get('/packages', getPackages);
router.post('/rate', ratePackage);

export default router;
