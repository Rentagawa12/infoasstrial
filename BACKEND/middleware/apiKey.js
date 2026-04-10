/**
 * API Key Authentication System
 * For external integrations and webhooks
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import { eventBus } from './eventLogger.js';

const API_KEY_HASH_ITERATIONS = Number(process.env.API_KEY_HASH_ITERATIONS || 210000);
const API_KEY_HASH_KEYLEN = 64;
const API_KEY_HASH_DIGEST = 'sha512';
const API_KEY_HASH_SALT = process.env.API_KEY_HASH_SALT || 'lost-and-found-api-key-salt';

const hashApiKey = (rawApiKey) => {
  return crypto.pbkdf2Sync(
    rawApiKey,
    API_KEY_HASH_SALT,
    API_KEY_HASH_ITERATIONS,
    API_KEY_HASH_KEYLEN,
    API_KEY_HASH_DIGEST
  ).toString('hex');
};

// API Key Schema
const apiKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  hashedKey: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'admin']
  }],
  active: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 365*24*60*60*1000) // 1 year
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for expiration
apiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const APIKey = mongoose.model('APIKey', apiKeySchema);

/**
 * Generate a new API key
 */
export const generateAPIKey = async (userId, name, permissions = ['read']) => {
  const key = `lfnd_${crypto.randomBytes(32).toString('hex')}`;
  const hashedKey = hashApiKey(key);
  
  const apiKey = new APIKey({
    key: hashedKey, // Store hashed version
    hashedKey,
    name,
    userId,
    permissions
  });
  
  await apiKey.save();
  
  eventBus.emit('security', { 
    message: 'API key generated',
    userId,
    name,
    permissions
  });
  
  // Return the actual key only once (it won't be stored in plain text)
  return {
    id: apiKey._id,
    key, // Show to user only once
    name,
    permissions,
    expiresAt: apiKey.expiresAt
  };
};

/**
 * Verify API key middleware
 */
export const verifyAPIKey = (requiredPermission = 'read') => {
  return async (req, res, next) => {
    try {
      const apiKey = req.header('X-API-Key');
      
      if (!apiKey) {
        return res.status(401).json({ 
          error: 'API key required. Include X-API-Key header.' 
        });
      }
      
      // Hash the provided key
      const hashedKey = hashApiKey(apiKey);
      
      // Find the API key
      const keyRecord = await APIKey.findOne({ 
        hashedKey,
        active: true,
        expiresAt: { $gt: new Date() }
      }).populate('userId', 'username email role');
      
      if (!keyRecord) {
        eventBus.emit('security', { 
          message: 'Invalid or expired API key used',
          ip: req.ip,
          path: req.path
        });
        return res.status(401).json({ error: 'Invalid or expired API key' });
      }
      
      // Check permission
      if (requiredPermission && !keyRecord.permissions.includes(requiredPermission) && !keyRecord.permissions.includes('admin')) {
        eventBus.emit('security', { 
          message: 'API key insufficient permissions',
          keyName: keyRecord.name,
          required: requiredPermission,
          has: keyRecord.permissions,
          ip: req.ip
        });
        return res.status(403).json({ 
          error: 'API key does not have required permission',
          required: requiredPermission
        });
      }
      
      // Update usage stats
      keyRecord.usageCount += 1;
      keyRecord.lastUsed = new Date();
      await keyRecord.save();
      
      // Attach user info to request
      req.apiKey = {
        id: keyRecord._id,
        name: keyRecord.name,
        permissions: keyRecord.permissions
      };
      req.user = {
        userId: keyRecord.userId._id,
        username: keyRecord.userId.username,
        email: keyRecord.userId.email,
        role: keyRecord.userId.role
      };
      
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

/**
 * Get all API keys for a user
 */
export const getUserAPIKeys = async (userId) => {
  const keys = await APIKey.find({ userId })
    .select('-hashedKey -key')
    .sort({ createdAt: -1 });
  
  return keys;
};

/**
 * Revoke an API key
 */
export const revokeAPIKey = async (keyId, userId) => {
  const key = await APIKey.findOne({ _id: keyId, userId });
  
  if (!key) {
    throw new Error('API key not found');
  }
  
  key.active = false;
  await key.save();
  
  eventBus.emit('security', { 
    message: 'API key revoked',
    keyId,
    keyName: key.name,
    userId
  });
  
  return key;
};

/**
 * Delete an API key
 */
export const deleteAPIKey = async (keyId, userId) => {
  const result = await APIKey.findOneAndDelete({ _id: keyId, userId });
  
  if (!result) {
    throw new Error('API key not found');
  }
  
  eventBus.emit('security', { 
    message: 'API key deleted',
    keyId,
    keyName: result.name,
    userId
  });
  
  return result;
};

export default {
  verifyAPIKey,
  generateAPIKey,
  getUserAPIKeys,
  revokeAPIKey,
  deleteAPIKey
};
