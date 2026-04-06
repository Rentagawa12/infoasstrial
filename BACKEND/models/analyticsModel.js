import mongoose from 'mongoose';

// Analytics event schema for tracking system usage
const analyticsEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['item_posted', 'item_claimed', 'item_viewed', 'user_registered', 'login', 'search'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

// Index for efficient querying
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Static method to record event
analyticsEventSchema.statics.recordEvent = async function(data) {
  const event = new this(data);
  await event.save();
  return event;
};

// Static method to get dashboard statistics
analyticsEventSchema.statics.getDashboardStats = async function() {
  const Item = mongoose.model('Item');
  const User = mongoose.model('User');
  
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Item statistics
  const totalItems = await Item.countDocuments();
  const lostItems = await Item.countDocuments({ status: 'lost' });
  const foundItems = await Item.countDocuments({ status: 'found' });
  const claimedItems = await Item.countDocuments({ status: 'claimed' });
  
  // Items by category
  const itemsByCategory = await Item.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  // Recent activity (last 30 days)
  const recentItems = await Item.countDocuments({ 
    createdAt: { $gte: last30Days } 
  });
  
  // User statistics
  const totalUsers = await User.countDocuments();
  const newUsers30d = await User.countDocuments({ 
    createdAt: { $gte: last30Days } 
  });
  
  // Claim rate (percentage of items claimed)
  const claimRate = totalItems > 0 
    ? ((claimedItems / totalItems) * 100).toFixed(2) 
    : 0;
  
  // Activity trends (last 7 days)
  const activityTrend = await this.aggregate([
    { $match: { timestamp: { $gte: last7Days } } },
    { 
      $group: { 
        _id: { 
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } 
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Top users (most active)
  const topUsers = await this.aggregate([
    { $match: { userId: { $exists: true }, timestamp: { $gte: last30Days } } },
    { $group: { _id: '$userId', activityCount: { $sum: 1 } } },
    { $sort: { activityCount: -1 } },
    { $limit: 5 },
    { 
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    { 
      $project: { 
        userId: '$_id',
        username: '$user.username',
        activityCount: 1 
      }
    }
  ]);
  
  return {
    items: {
      total: totalItems,
      lost: lostItems,
      found: foundItems,
      claimed: claimedItems,
      recent30d: recentItems,
      claimRate: parseFloat(claimRate),
      byCategory: itemsByCategory
    },
    users: {
      total: totalUsers,
      new30d: newUsers30d,
      topUsers
    },
    activity: {
      trend: activityTrend
    }
  };
};

// Static method to get item statistics by date range
analyticsEventSchema.statics.getItemStats = async function(startDate, endDate) {
  const Item = mongoose.model('Item');
  
  const query = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  const stats = await Item.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          status: '$status',
          category: '$category'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.status',
        categories: {
          $push: {
            category: '$_id.category',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);
  
  return stats;
};

export default mongoose.model('AnalyticsEvent', analyticsEventSchema);
