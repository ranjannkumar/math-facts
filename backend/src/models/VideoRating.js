import mongoose from 'mongoose';

const VideoRatingSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 10 
  },
  level: { 
    type: Number, 
    required: true 
  },
  beltOrDegree: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

VideoRatingSchema.index({ user: 1, level: 1, beltOrDegree: 1 });

export default mongoose.model('VideoRating', VideoRatingSchema);