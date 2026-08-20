import { Router } from 'express';
import {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getDashboardStats,
  getPublicStats,
} from '../controllers/groupController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();

router.get('/public-stats', getPublicStats);
router.get('/dashboard-stats', protect, getDashboardStats);

router.route('/')
  .get(protect, getGroups)
  .post(protect, createGroup);

router.route('/:id')
  .get(protect, getGroup)
  .put(protect, updateGroup)
  .delete(protect, deleteGroup);

router.post('/:id/join', protect, joinGroup);
router.post('/:id/leave', protect, leaveGroup);

export default router;
