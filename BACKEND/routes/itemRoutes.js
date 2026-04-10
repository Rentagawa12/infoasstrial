import express from 'express';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Item from '../models/itemModel.js';
import {
  getItems,
  postItem,
  updateItemStatus,
  deleteItem
} from '../controllers/itemController.js';
import { auth, adminOnly } from '../middleware/auth.js';
import { validateItem } from '../middleware/eventLogger.js';
import { rateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

// __dirname setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ══════════════════════════════════════════════════════════════════════════════
// Cloudinary Configuration (Cloud Storage for Images)
// ══════════════════════════════════════════════════════════════════════════════

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use Cloudinary storage if credentials are provided, otherwise fall back to local storage
const storage = process.env.CLOUDINARY_CLOUD_NAME 
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'lost-and-found-tip',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
        public_id: (req, file) => `item-${Date.now()}`
      }
    })
  : multer.diskStorage({
      destination: function(req, file, cb) {
        // Fallback to local storage (for development/testing)
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
      }
    });

// File type validation
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, png, gif, webp) are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// ══════════════════════════════════════════════════════════════════════════════
// Routes
// ══════════════════════════════════════════════════════════════════════════════

// PUBLIC: GET all items (with optional ?status= and ?q= filters)
router.get('/', rateLimit('public'), getItems);

// PUBLIC: POST new item
router.post('/', rateLimit('public'), upload.single('image'), validateItem, postItem);

// PUBLIC: PATCH status
router.patch('/:id', rateLimit('public'), updateItemStatus);

// PROTECTED: DELETE item — admin only (RBAC enforcement)
router.delete('/:id', rateLimit('strict'), auth, adminOnly, deleteItem);

export default router;
