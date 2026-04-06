import Item from '../models/itemModel.js';

export const getItems = async (req, res) => {
  try {
    const { status, q } = req.query;
    const query = {};
    if (status) query.status = status;
    if (q) query.itemName = new RegExp(q, 'i');

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
      itemData.imageURL = `https://infoassproj.onrender.com/uploads/${req.file.filename}`;
    }

    const newItem = new Item(itemData);
    const savedItem = await newItem.save();
    
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
    const updated = await Item.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
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
