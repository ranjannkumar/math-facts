import mongoose from 'mongoose';

const QuestionTemplateSchema = new mongoose.Schema({
  operation: { type: String, enum: ['add','sub','mul','div'], index: true },
  level: { type: Number, index: true }, // 1..6 for colored belts
  beltOrDegree: { type: String, index: true }, // 'white'..'brown' or 'black-1'..'black-7'
  a: { type: Number, required: true },
  b: { type: Number, required: true },
  factType: { type: String, enum: ['identical','non-identical'], required: true },
  isIdenticalPair: { type: Boolean, required: true },
  metadata: { type: Object }
}, { timestamps: true });

QuestionTemplateSchema.index({ operation:1, level:1, beltOrDegree:1 });

export default mongoose.model('QuestionTemplate', QuestionTemplateSchema);
