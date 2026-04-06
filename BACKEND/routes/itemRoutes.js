import express from 'express';
import multer from 'multer';
import path from 'path';
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

const router = express.Router();

// __dirname setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Use absolute path to BACKEND/uploads
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

// PUBLIC: GET all items (with optional ?status= and ?q= filters)
router.get('/', getItems);

// PUBLIC: POST new item — student verification via form data
// Note: For academic demo - in production this should require JWT auth
router.post('/', upload.single('image'), validateItem, postItem);

// PUBLIC: PATCH status — allow anyone to claim items
// Note: For academic demo - in production this should require JWT auth
router.patch('/:id', updateItemStatus);

// PROTECTED: DELETE item — admin only (RBAC enforcement)
router.delete('/:id', auth, adminOnly, deleteItem);

export default router;
