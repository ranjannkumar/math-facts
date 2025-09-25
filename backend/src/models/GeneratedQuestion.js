import mongoose from 'mongoose';

const GeneratedQuestionSchema = new mongoose.Schema({
  templateRef: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionTemplate' },
  operation: { type: String, enum: ['add','sub','mul','div'], index: true },
  level: { type: Number, index: true },
  beltOrDegree: { type: String, index: true },
  params: { a: Number, b: Number },
  correctAnswer: { type: Number, required: true },
  choices: {
    type: [Number],
    validate: v => v.length === 4
  },
  source: { type: String, enum: ['current','previous'] },
  seed: { type: String }
}, { timestamps: true });

export default mongoose.model('GeneratedQuestion', GeneratedQuestionSchema);
