import User from '../models/userModel.js';
import Item from '../models/itemModel.js';

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;

    // Check for duplicate email/username if they're being changed
    if (username || email) {
      const existingUser = await User.findOne({
        $or: [
          { email: email || null },
          { username: username || null }
        ],
        _id: { $ne: req.user.userId }
      });

      if (existingUser) {
        return res.status(400).json({
          error: 'Email or username already in use'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's posted items
export const getMyItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { studentId: req.body.studentId || req.user.userId };
    if (status) {
      query.status = status;
    }

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

// Delete user account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Password is required to delete account'
      });
    }

    // Verify password
    const user = await User.findById(req.user.userId);
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }

    // Delete user's items first
    await Item.deleteMany({ studentId: user._id.toString() });

    // Delete user
    await User.findByIdAndDelete(req.user.userId);

    res.json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
