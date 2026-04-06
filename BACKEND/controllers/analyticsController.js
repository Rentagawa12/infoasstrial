import AnalyticsEvent from '../models/analyticsModel.js';
import Item from '../models/itemModel.js';
import User from '../models/userModel.js';

// Get comprehensive dashboard statistics
export const getDashboard = async (req, res) => {
  try {
    const stats = await AnalyticsEvent.getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get item statistics by date range
export const getItemStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate query parameters are required' 
      });
    }
    
    const stats = await AnalyticsEvent.getItemStats(startDate, endDate);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get activity trends
export const getActivityTrends = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const trends = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            eventType: '$eventType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          events: {
            $push: {
              type: '$_id.eventType',
              count: '$count'
            }
          },
          totalEvents: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user engagement metrics
export const getUserEngagement = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const engagement = await AnalyticsEvent.aggregate([
      { $match: { userId: { $exists: true }, timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$userId',
          totalEvents: { $sum: 1 },
          lastActivity: { $max: '$timestamp' },
          eventTypes: { $addToSet: '$eventType' }
        }
      },
      { $sort: { totalEvents: -1 } },
      { $limit: 20 },
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
          email: '$user.email',
          totalEvents: 1,
          lastActivity: 1,
          eventTypes: 1
        }
      }
    ]);
    
    res.json(engagement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Record an analytics event
export const recordEvent = async (req, res) => {
  try {
    const { eventType, itemId, metadata } = req.body;
    
    const event = await AnalyticsEvent.recordEvent({
      eventType,
      userId: req.user?.userId,
      itemId,
      metadata,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get category distribution
export const getCategoryDistribution = async (req, res) => {
  try {
    const distribution = await Item.aggregate([
      {
        $group: {
          _id: {
            category: '$category',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get success rate (items claimed vs total)
export const getSuccessRate = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const stats = await Item.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          claimed: {
            $sum: { $cond: [{ $eq: ['$status', 'claimed'] }, 1, 0] }
          },
          lost: {
            $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] }
          },
          found: {
            $sum: { $cond: [{ $eq: ['$status', 'found'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          claimed: 1,
          lost: 1,
          found: 1,
          successRate: {
            $multiply: [
              { $divide: ['$claimed', '$total'] },
              100
            ]
          }
        }
      }
    ]);
    
    res.json(stats[0] || { total: 0, claimed: 0, lost: 0, found: 0, successRate: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
