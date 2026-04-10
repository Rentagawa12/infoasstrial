import Item from '../models/itemModel.js';
import { eventBus } from '../middleware/eventLogger.js';

export const getItems = async (req, res) => {
  try {
    const { status, q } = req.query;
    const query = {};
    if (typeof status === 'string' && ['lost', 'found', 'claimed'].includes(status)) {
      query.status = status;
    }
    if (typeof q === 'string' && q.trim()) {
      const escapedSearch = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.itemName = { $regex: escapedSearch, $options: 'i' };
    }

    const items = await Item.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const postItem = async (req, res) => {
  try {
    console.log('Received data:', req.body);  // Debug log
    
    // Validate required fields
    const requiredFields = ['itemName', 'description', 'category', 'dateLostOrFound', 'status', 'contactInfo', 'studentId', 'studentName'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}`,
        receivedData: req.body
      });
    }

    const itemData = {
      itemName: req.body.itemName,
      description: req.body.description,
      category: req.body.category,
      dateLostOrFound: req.body.dateLostOrFound,
      status: req.body.status,
      contactInfo: req.body.contactInfo,
      studentId: req.body.studentId,
      studentName: req.body.studentName
    };

    if (req.file) {
      // If using Cloudinary, req.file.path contains the full Cloudinary URL
      // If using local storage, build the URL from the request host
      if (typeof req.file.path === 'string') {
        try {
          const parsedUrl = new URL(req.file.path);
          const isCloudinaryHost = parsedUrl.hostname === 'res.cloudinary.com' ||
            parsedUrl.hostname.endsWith('.cloudinary.com');
          if (isCloudinaryHost && parsedUrl.protocol === 'https:') {
            itemData.imageURL = parsedUrl.toString();
          }
        } catch (_) {
          // Fall back to local URL construction below
        }
      }

      if (!itemData.imageURL) {
        // Local storage - build URL dynamically
        const protocol = req.get('x-forwarded-proto') || req.protocol;
        const host = req.get('host');
        itemData.imageURL = `${protocol}://${host}/uploads/${req.file.filename}`;
      }
      
      console.log('Image uploaded:', {
        filename: req.file.filename,
        path: req.file.path,
        imageURL: itemData.imageURL,
        storage: req.file.path && req.file.path.includes('cloudinary.com') ? 'Cloudinary' : 'Local'
      });
    }

    const newItem = new Item(itemData);
    const savedItem = await newItem.save();
    
    // Emit event for orchestration (notifications, analytics)
    eventBus.emit('item:created', savedItem);
    
    console.log('Item saved successfully:', savedItem);  // Debug log
    res.status(201).json(savedItem);
  } catch (err) {
    console.error('Error saving item:', err);  // Debug log
    
    // Provide more detailed error message
    const errorMessage = err.name === 'ValidationError' 
      ? Object.values(err.errors).map(e => e.message).join(', ')
      : err.message;
    
    res.status(400).json({ 
      error: errorMessage,
      details: err.name === 'ValidationError' ? err.errors : undefined
    });
  }
};

export const updateItemStatus = async (req, res) => {
  try {
    const allowedStatuses = ['lost', 'found', 'claimed'];
    if (!allowedStatuses.includes(req.body?.status)) {
      return res.status(422).json({ error: 'Invalid status value' });
    }

    const updated = await Item.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Emit event if item was claimed
    if (req.body.status === 'claimed' && updated) {
      eventBus.emit('item:claimed', updated);
    }
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
