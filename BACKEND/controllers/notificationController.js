import Notification from '../models/notificationModel.js';
import { eventBus } from '../middleware/eventLogger.js';

// Get all notifications for current user
export const getNotifications = async (req, res) => {
  try {
    const { read, limit = 20, skip = 0 } = req.query;
    const query = { userId: req.user.userId };
    
    if (read !== undefined) {
      query.read = read === 'true';
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('itemId', 'itemName category status');
    
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user.userId, 
      read: false 
    });
    
    res.json({
      notifications,
      unreadCount,
      total: await Notification.countDocuments(query)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    await notification.markAsRead();
    
    eventBus.emit('notification:read', { 
      notificationId: notification._id,
      userId: req.user.userId 
    });
    
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.userId, read: false },
      { read: true }
    );
    
    eventBus.emit('notification:bulk_read', { 
      userId: req.user.userId,
      count: result.modifiedCount
    });
    
    res.json({ 
      message: 'All notifications marked as read',
      count: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create notification (admin/system only)
export const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, itemId, priority, metadata } = req.body;
    
    const notification = await Notification.createNotification({
      userId,
      type,
      title,
      message,
      itemId,
      priority,
      metadata
    });
    
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user.userId, 
      read: false 
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
