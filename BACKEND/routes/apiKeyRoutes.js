import express from 'express';
import { auth } from '../middleware/rbac.js';
import { 
  generateAPIKey, 
  getUserAPIKeys, 
  revokeAPIKey, 
  deleteAPIKey 
} from '../middleware/apiKey.js';
import { rateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

// All API key management routes require authentication
router.use(rateLimit('authenticated'));
router.use(auth);

// GET /api/keys - Get all API keys for current user
router.get('/', async (req, res) => {
  try {
    const keys = await getUserAPIKeys(req.user.userId);
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/keys - Generate new API key
router.post('/', rateLimit('strict'), async (req, res) => {
  try {
    const { name, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'API key name is required' });
    }
    
    const validPermissions = ['read', 'write', 'delete', 'admin'];
    const perms = permissions && Array.isArray(permissions) 
      ? permissions.filter(p => validPermissions.includes(p))
      : ['read'];
    
    const apiKey = await generateAPIKey(req.user.userId, name, perms);
    
    res.status(201).json({
      message: 'API key created successfully. Save this key, it will not be shown again.',
      ...apiKey
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/keys/:id/revoke - Revoke an API key
router.patch('/:id/revoke', rateLimit('strict'), async (req, res) => {
  try {
    const key = await revokeAPIKey(req.params.id, req.user.userId);
    res.json({ message: 'API key revoked', key });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// DELETE /api/keys/:id - Delete an API key
router.delete('/:id', rateLimit('strict'), async (req, res) => {
  try {
    await deleteAPIKey(req.params.id, req.user.userId);
    res.json({ message: 'API key deleted' });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
