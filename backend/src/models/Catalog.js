// Optional: map which facts belong to which belt/level (addition v1)
import mongoose from 'mongoose';

const CatalogSchema = new mongoose.Schema({
  operation: { type: String, enum: ['add'], index: true },
  level: { type: Number, index: true },
  belt: { type: String, enum: ['white','yellow','green','blue','red','brown'], index: true },
  facts: [{
    a: Number, b: Number, identical: Boolean
  }]
}, { timestamps: true });

CatalogSchema.index({ operation:1, level:1, belt:1 }, { unique: true });

export default mongoose.model('Catalog', CatalogSchema);
