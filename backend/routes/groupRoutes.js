import { Router } from 'express';
import multer from 'multer';
import path from 'path';
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
  uploadResource,
} from '../controllers/groupController.js';
import protect from '../middleware/authMiddleware.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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
router.post('/:id/resources', protect, upload.single('resource'), uploadResource);

export default router;
