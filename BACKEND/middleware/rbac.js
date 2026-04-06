/**
 * Enhanced Role-Based Access Control (RBAC) Middleware
 * Implements fine-grained permissions system with roles and actions
 */

import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { eventBus } from './eventLogger.js';

// Define roles and their permissions
export const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

// Define permissions for each role
export const PERMISSIONS = {
  [ROLES.USER]: [
    'item:read',
    'item:create',
    'item:update:own',
    'notification:read:own',
    'notification:update:own',
    'profile:read:own',
    'profile:update:own'
  ],
  [ROLES.MODERATOR]: [
    'item:read',
    'item:create',
    'item:update:own',
    'item:update:any',
    'item:delete:flagged',
    'notification:read:own',
    'notification:update:own',
    'notification:create',
    'profile:read:own',
    'profile:update:own',
    'analytics:read:basic'
  ],
  [ROLES.ADMIN]: [
    'item:read',
    'item:create',
    'item:update:own',
    'item:update:any',
    'item:delete:any',
    'notification:read:own',
    'notification:read:any',
    'notification:update:own',
    'notification:create',
    'user:read:any',
    'user:update:any',
    'user:delete:any',
    'profile:read:own',
    'profile:read:any',
    'profile:update:own',
    'profile:update:any',
    'analytics:read:full',
    'analytics:export',
    'system:configure'
  ]
};

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      eventBus.emit('security', { 
        message: 'Authentication attempted without token',
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch fresh user data to ensure role is current
    const user = await User.findById(decoded.userId).select('_id username email role');
    
    if (!user) {
      eventBus.emit('security', { 
        message: 'Authentication with invalid user ID',
        userId: decoded.userId,
        ip: req.ip
      });
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    eventBus.emit('security', { 
      message: 'Authentication failed',
      error: error.message,
      ip: req.ip
    });
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (userRole, permission) => {
  const rolePermissions = PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

/**
 * Require specific permission middleware
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!hasPermission(req.user.role, permission)) {
      eventBus.emit('security', { 
        message: 'Permission denied',
        userId: req.user.userId,
        permission,
        role: req.user.role,
        path: req.path,
        ip: req.ip
      });
      return res.status(403).json({ 
        error: 'Permission denied',
        required: permission,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

/**
 * Require specific role middleware
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      eventBus.emit('security', { 
        message: 'Role access denied',
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
        ip: req.ip
      });
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredRole: allowedRoles,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

/**
 * Admin only middleware (legacy support)
 */
export const adminOnly = requireRole(ROLES.ADMIN);

/**
 * Moderator or Admin middleware
 */
export const moderatorOrAdmin = requireRole(ROLES.MODERATOR, ROLES.ADMIN);

/**
 * Check resource ownership middleware
 * Used for operations that require user to own the resource
 */
export const requireOwnership = (resourceType, idField = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idField];
      
      // Import models dynamically to avoid circular dependencies
      let Resource;
      switch (resourceType) {
        case 'item':
          Resource = (await import('../models/itemModel.js')).default;
          break;
        case 'notification':
          Resource = (await import('../models/notificationModel.js')).default;
          break;
        default:
          return res.status(400).json({ error: 'Invalid resource type' });
      }
      
      const resource = await Resource.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ error: `${resourceType} not found` });
      }
      
      // Check ownership (adjust field names based on your models)
      const ownerField = resourceType === 'item' ? 'studentId' : 'userId';
      const isOwner = resource[ownerField]?.toString() === req.user.userId.toString();
      
      // Admins can access any resource
      const isAdmin = req.user.role === ROLES.ADMIN;
      const isModerator = req.user.role === ROLES.MODERATOR;
      
      if (!isOwner && !isAdmin && !isModerator) {
        eventBus.emit('security', { 
          message: 'Ownership check failed',
          userId: req.user.userId,
          resourceType,
          resourceId,
          ip: req.ip
        });
        return res.status(403).json({ 
          error: 'You do not have permission to access this resource' 
        });
      }
      
      // Attach resource to request for use in route handler
      req.resource = resource;
      req.isOwner = isOwner;
      
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('_id username email role');
      
      if (user) {
        req.user = {
          userId: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

export default {
  auth,
  adminOnly,
  moderatorOrAdmin,
  requireRole,
  requirePermission,
  requireOwnership,
  optionalAuth,
  hasPermission,
  ROLES,
  PERMISSIONS
};
