import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    academicTerm: { type: String, required: true, trim: true },
    items: [{
      name: { type: String, required: true, trim: true },
      amount: { type: Number, required: true, min: 0 },
    }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

feeStructureSchema.index({ class: 1, academicTerm: 1, isActive: 1 });
export default mongoose.model('FeeStructure', feeStructureSchema);
