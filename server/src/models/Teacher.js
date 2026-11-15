import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    assignedClasses: [
      {
        class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
        section: { type: String, uppercase: true },
        subject: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'on_leave', 'resigned'],
      default: 'active',
    },
  },
  { timestamps: true }
);

const Teacher = mongoose.model('Teacher', teacherSchema);
export default Teacher;
