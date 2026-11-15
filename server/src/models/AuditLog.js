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
    module: {
      type: String,
      enum: ['student', 'teacher', 'guardian', 'class', 'subject', 'attendance', 'examination', 'result', 'fee_structure', 'invoice', 'payment', 'auth', 'system'],
      default: 'system',
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    entityType: {
      type: String,
      trim: true,
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
        'TEACHER_CREATED',
        'TEACHER_UPDATED',
        'TEACHER_DEACTIVATED',
        'GUARDIAN_UPDATED',
        'CLASS_CREATED',
        'CLASS_UPDATED',
        'CLASS_DELETED',
        'SUBJECT_CREATED',
        'SUBJECT_UPDATED',
        'SUBJECT_DELETED',
        'ATTENDANCE_UPDATED',
        'EXAMINATION_UPDATED',
        'EXAMINATION_DELETED',
        'RESULT_UPDATED',
        'FEE_STRUCTURE_CREATED',
        'FEE_STRUCTURE_UPDATED',
        'FEE_STRUCTURE_DEACTIVATED',
        'INVOICE_UPDATED',
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
auditLogSchema.index({ createdAt: -1, module: 1 });

const moduleByAction = {
  STUDENT_ENROLLED: 'student',
  STUDENT_UPDATED: 'student',
  TEACHER_ASSIGNED: 'teacher',
  ATTENDANCE_RECORDED: 'attendance',
  EXAMINATION_CREATED: 'examination',
  MARKS_SUBMITTED: 'result',
  FEE_INVOICE_GENERATED: 'invoice',
  FEE_PAYMENT_RECORDED: 'payment',
  TEACHER_CREATED: 'teacher',
  TEACHER_UPDATED: 'teacher',
  TEACHER_DEACTIVATED: 'teacher',
  GUARDIAN_UPDATED: 'guardian',
  CLASS_CREATED: 'class',
  CLASS_UPDATED: 'class',
  CLASS_DELETED: 'class',
  SUBJECT_CREATED: 'subject',
  SUBJECT_UPDATED: 'subject',
  SUBJECT_DELETED: 'subject',
  ATTENDANCE_UPDATED: 'attendance',
  EXAMINATION_UPDATED: 'examination',
  EXAMINATION_DELETED: 'examination',
  RESULT_UPDATED: 'result',
  FEE_STRUCTURE_CREATED: 'fee_structure',
  FEE_STRUCTURE_UPDATED: 'fee_structure',
  FEE_STRUCTURE_DEACTIVATED: 'fee_structure',
  INVOICE_UPDATED: 'invoice',
  USER_LOGIN: 'auth',
  SYSTEM_CONFIG_UPDATED: 'system',
};

auditLogSchema.pre('validate', function setAuditModule(next) {
  if (!this.module || this.module === 'system') this.module = moduleByAction[this.action] || 'system';
  next();
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
