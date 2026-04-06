/**
 * API Orchestration Layer
 * Coordinates communication between Items, Users, Notifications, and Analytics modules
 * Implements event-driven architecture for cross-module integration
 */

import { eventBus } from './eventLogger.js';
import Notification from '../models/notificationModel.js';
import AnalyticsEvent from '../models/analyticsModel.js';
import User from '../models/userModel.js';

/**
 * Initialize orchestration listeners
 * These listeners handle cross-module communication via the event bus
 */
export const initializeOrchestration = () => {
  console.log('[Orchestration] Initializing API orchestration layer...');
  
  // ── Item-to-Notification Integration ─────────────────────────────────────────
  
  // When a new item is created, check for matches and notify
  eventBus.on('item:created', async (item) => {
    try {
      console.log(`[Orchestration] Processing new item: ${item.itemName}`);
      
      // Check for potential matches
      await Notification.checkItemMatches(item);
      
      // Record analytics event
      await AnalyticsEvent.recordEvent({
        eventType: 'item_posted',
        itemId: item._id,
        metadata: { 
          category: item.category, 
          status: item.status,
          studentId: item.studentId
        }
      });
      
      console.log(`[Orchestration] Item processed successfully`);
    } catch (error) {
      console.error('[Orchestration] Error processing new item:', error);
    }
  });
  
  // When an item is claimed, notify the owner and record analytics
  eventBus.on('item:claimed', async (item) => {
    try {
      console.log(`[Orchestration] Item claimed: ${item.itemName}`);
      
      // Find the user who posted the item
      const user = await User.findOne({ 
        $or: [
          { email: item.contactInfo },
          { username: item.studentName }
        ]
      });
      
      if (user) {
        // Create notification
        await Notification.createNotification({
          userId: user._id,
          type: 'item_claimed',
          title: 'Item Claimed!',
          message: `Your ${item.status} item "${item.itemName}" has been claimed.`,
          itemId: item._id,
          priority: 'high'
        });
      }
      
      // Record analytics
      await AnalyticsEvent.recordEvent({
        eventType: 'item_claimed',
        itemId: item._id,
        metadata: { category: item.category }
      });
      
    } catch (error) {
      console.error('[Orchestration] Error processing claimed item:', error);
    }
  });
  
  // When an item is about to expire, notify the owner
  eventBus.on('item:expiring', async (item) => {
    try {
      console.log(`[Orchestration] Item expiring soon: ${item.itemName}`);
      
      const user = await User.findOne({ 
        $or: [
          { email: item.contactInfo },
          { username: item.studentName }
        ]
      });
      
      if (user) {
        await Notification.createNotification({
          userId: user._id,
          type: 'item_expiring',
          title: 'Item Expiring Soon',
          message: `Your ${item.status} item "${item.itemName}" will expire in ${item.daysUntilExpiration()} days.`,
          itemId: item._id,
          priority: 'medium'
        });
      }
      
    } catch (error) {
      console.error('[Orchestration] Error processing expiring item:', error);
    }
  });
  
  // ── User-to-Analytics Integration ────────────────────────────────────────────
  
  eventBus.on('user:registered', async (user) => {
    try {
      await AnalyticsEvent.recordEvent({
        eventType: 'user_registered',
        userId: user._id,
        metadata: { role: user.role }
      });
      
      // Send welcome notification
      await Notification.createNotification({
        userId: user._id,
        type: 'system',
        title: 'Welcome to Lost & Found!',
        message: 'Thank you for registering. You can now post lost and found items.',
        priority: 'low'
      });
      
      console.log(`[Orchestration] New user registered: ${user.username}`);
    } catch (error) {
      console.error('[Orchestration] Error processing user registration:', error);
    }
  });
  
  eventBus.on('user:login', async (user) => {
    try {
      await AnalyticsEvent.recordEvent({
        eventType: 'login',
        userId: user._id,
        metadata: { timestamp: new Date() }
      });
    } catch (error) {
      console.error('[Orchestration] Error recording login:', error);
    }
  });
  
  // ── Notification-to-Analytics Integration ────────────────────────────────────
  
  eventBus.on('notification:created', async (notification) => {
    console.log(`[Orchestration] Notification created: ${notification.title} for user ${notification.userId}`);
    // Could trigger push notifications, emails, etc. here
  });
  
  eventBus.on('notification:read', async (data) => {
    console.log(`[Orchestration] Notification read: ${data.notificationId} by user ${data.userId}`);
  });
  
  // ── Security Events ───────────────────────────────────────────────────────────
  
  eventBus.on('security', async (event) => {
    // Log security events for admin review
    console.warn(`[Security] ${event.message}`, event.meta);
    
    // Could send alerts to admins here
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.createNotification({
        userId: admin._id,
        type: 'system',
        title: 'Security Alert',
        message: `Security event: ${event.message}`,
        priority: 'high',
        metadata: event.meta
      });
    }
  });
  
  // ── Error Handling ────────────────────────────────────────────────────────────
  
  eventBus.on('error', (error) => {
    console.error('[Orchestration] Event bus error:', error);
  });
  
  console.log('[Orchestration] API orchestration layer initialized successfully');
};

/**
 * Trigger an orchestration event
 * Use this to emit events from controllers
 */
export const triggerEvent = (eventName, data) => {
  eventBus.emit(eventName, data);
};

/**
 * Middleware to record page views/searches
 */
export const recordActivity = (activityType) => {
  return async (req, res, next) => {
    try {
      const metadata = {
        query: req.query,
        path: req.path
      };
      
      if (req.user) {
        await AnalyticsEvent.recordEvent({
          eventType: activityType,
          userId: req.user.userId,
          metadata,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        });
      }
    } catch (error) {
      console.error('[Orchestration] Error recording activity:', error);
    }
    next();
  };
};

export default { initializeOrchestration, triggerEvent, recordActivity };
