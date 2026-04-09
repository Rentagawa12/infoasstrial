import User from '../models/userModel.js';
import Item from '../models/itemModel.js';
import { getRecentLogs } from '../middleware/eventLogger.js';

// Get dashboard statistics
export const getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalItems = await Item.countDocuments();
    const claimedItems = await Item.countDocuments({ status: 'claimed' });
    const lostItems = await Item.countDocuments({ status: 'lost' });
    const foundItems = await Item.countDocuments({ status: 'found' });

    // Get items by category
    const itemsByCategory = await Item.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent activity
    const recentItems = await Item.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('itemName status createdAt studentName');

    res.json({
      summary: {
        totalUsers,
        totalItems,
        claimedItems,
        lostItems,
        foundItems
      },
      itemsByCategory,
      recentActivity: recentItems,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all users with pagination
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all items with admin view
export const getAllItems = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const items = await Item.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(query);

    res.json({
      items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete user by ID
export const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user's items
    await Item.deleteMany({ studentId: id });

    // Delete user
    await User.findByIdAndDelete(id);

    res.json({
      message: `User ${user.username} and their items deleted`,
      deletedUserId: id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete item by ID
export const deleteItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Item.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get system logs
export const getSystemLogs = async (req, res) => {
  try {
    const { level = 'all', limit = 100 } = req.query;

    let logs = getRecentLogs();

    if (level !== 'all') {
      logs = logs.filter(log => log.status >= 400);
    }

    logs = logs.slice(-parseInt(limit));

    res.json({
      logs,
      count: logs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
