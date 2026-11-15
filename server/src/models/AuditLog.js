import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'STUDENT_ENROLLED',
        'STUDENT_UPDATED',
        'TEACHER_ASSIGNED',
        'ATTENDANCE_RECORDED',
        'EXAMINATION_CREATED',
        'MARKS_SUBMITTED',
        'FEE_INVOICE_GENERATED',
        'FEE_PAYMENT_RECORDED',
        'USER_LOGIN',
        'SYSTEM_CONFIG_UPDATED',
      ],
    },
    details: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
