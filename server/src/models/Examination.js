import mongoose from 'mongoose';

const gradingRuleSchema = new mongoose.Schema(
  {
    minPercentage: { type: Number, required: true, min: 0, max: 100 },
    maxPercentage: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, required: true, trim: true },
    remark: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const examinationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['unit', 'midterm', 'final', 'annual', 'custom'], default: 'unit' },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    sections: [{ type: String, uppercase: true, trim: true }],
    subjects: [
      {
        subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
        maxMarks: { type: Number, required: true, min: 1 },
      },
    ],
    scheduledDate: { type: Date, required: true },
    academicYear: { type: String, required: true, trim: true },
    gradingRules: { type: [gradingRuleSchema], required: true },
    status: { type: String, enum: ['draft', 'scheduled', 'completed'], default: 'draft' },
  },
  { timestamps: true }
);

examinationSchema.index({ class: 1, scheduledDate: 1 });
export default mongoose.model('Examination', examinationSchema);
