import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentReference: { type: String, required: true, unique: true, uppercase: true, trim: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: ['cash', 'bank_transfer', 'simulated_online'], default: 'simulated_online' },
    notes: { type: String, trim: true, default: '' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ invoice: 1, createdAt: -1 });
paymentSchema.index({ student: 1, createdAt: -1 });
export default mongoose.model('Payment', paymentSchema);
