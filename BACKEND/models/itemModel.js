import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: ['electronics', 'accessories', 'documents', 'clothing', 'books', 'others'] },
  dateLostOrFound: { type: Date, required: true },
  status: { type: String, enum: ['lost', 'found', 'claimed'], required: true },
  contactInfo: { type: String, required: true },
  imageURL: { type: String },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  location: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(+new Date() + 30*24*60*60*1000) } // 30 days from creation
}, { timestamps: true });

// Add index for expiration
itemSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Add a method to check if item is about to expire
itemSchema.methods.daysUntilExpiration = function() {
  const now = new Date();
  const diff = this.expiresAt - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Add a virtual field for expiration status
itemSchema.virtual('expirationStatus').get(function() {
  const daysLeft = this.daysUntilExpiration();
  if (daysLeft <= 0) return 'expired';
  if (daysLeft <= 5) return 'expiring-soon';
  return 'active';
});

export default mongoose.model('Item', itemSchema);
