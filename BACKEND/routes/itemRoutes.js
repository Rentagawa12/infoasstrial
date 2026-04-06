import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
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

// PROTECTED: POST new item — any authenticated user
router.post('/', auth, upload.single('image'), validateItem, postItem);

// PROTECTED: PATCH status — any authenticated user (owner/admin)
router.patch('/:id', auth, updateItemStatus);

// PROTECTED: DELETE item — admin only (RBAC enforcement)
router.delete('/:id', auth, adminOnly, deleteItem);

export default router;
