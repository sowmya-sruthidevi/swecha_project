import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();

router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

export default router;
