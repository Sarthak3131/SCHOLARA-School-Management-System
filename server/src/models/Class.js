import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Class code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    sections: [
      {
        name: { type: String, required: true, uppercase: true },
        capacity: { type: Number, default: 40 },
      },
    ],
    academicYear: {
      type: String,
      default: '2024-2025',
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const Class = mongoose.model('Class', classSchema);
export default Class;
