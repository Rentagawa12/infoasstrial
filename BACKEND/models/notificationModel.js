import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: {
    type: String,
    enum: ['item_match', 'item_claimed', 'item_expiring', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  read: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000) // 30 days
  }
}, { timestamps: true });

// Index for efficient querying
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // Emit event for real-time notifications
  const { eventBus } = await import('../middleware/eventLogger.js');
  eventBus.emit('notification:created', notification);
  
  return notification;
};

// Static method to check for item matches
notificationSchema.statics.checkItemMatches = async function(newItem) {
  const Item = mongoose.model('Item');
  
  // Find potentially matching items (opposite status)
  const oppositeStatus = newItem.status === 'lost' ? 'found' : 'lost';
  const matches = await Item.find({
    status: oppositeStatus,
    category: newItem.category,
    $or: [
      { itemName: new RegExp(newItem.itemName, 'i') },
      { description: new RegExp(newItem.itemName, 'i') }
    ]
  }).limit(5);
  
  // Create notifications for matches
  for (const match of matches) {
    await this.createNotification({
      userId: newItem.studentId, // Would need to map to actual user ID
      type: 'item_match',
      title: 'Potential Match Found!',
      message: `A ${oppositeStatus} item matching "${newItem.itemName}" was found.`,
      itemId: match._id,
      priority: 'high',
      metadata: { matchedItemId: match._id }
    });
  }
  
  return matches.length;
};

export default mongoose.model('Notification', notificationSchema);
