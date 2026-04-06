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
<<<<<<< HEAD
=======
import { auth, adminOnly } from '../middleware/auth.js';
import { validateItem } from '../middleware/eventLogger.js';
>>>>>>> a74e418 (Changes)

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

<<<<<<< HEAD
const upload = multer({ storage: storage });

// Routes
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const itemData = {
            ...req.body,
            imageURL: req.file ? `/uploads/${req.file.filename}` : null,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        };

        const item = new Item(itemData);
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

router.get('/', async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

router.delete('/:id', deleteItem); // Admin only
=======
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
>>>>>>> a74e418 (Changes)

export default router;
