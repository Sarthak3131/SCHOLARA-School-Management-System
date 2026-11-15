/**
 * SCHOLARA — Database Seed Script
 * Seeds initial demo accounts for Admin, Teacher, and Guardian roles.
 *
 * Usage: npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Attendance from '../models/Attendance.js';
import Invoice from '../models/Invoice.js';
import AuditLog from '../models/AuditLog.js';

export const seedAllData = async () => {
  console.log('🌱  Starting SCHOLARA Database Seeding...');

  // 1. Auth Users
  const demoUsers = [
    {
      name: 'Dr. Arthur Vance',
      email: 'admin@scholara.edu',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98765 43210',
    },
    {
      name: 'Clara Oswald',
      email: 'teacher@scholara.edu',
      password: 'Teacher@123',
      role: 'teacher',
      phone: '+91 98765 43211',
    },
    {
      name: 'David Miller',
      email: 'guardian@scholara.edu',
      password: 'Guardian@123',
      role: 'guardian',
      phone: '+91 98765 43212',
    },
  ];

  const seededUsers = {};
  for (const u of demoUsers) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create(u);
    } else {
      user.name = u.name;
      user.password = u.password;
      user.role = u.role;
      user.isActive = true;
      await user.save();
    }
    seededUsers[u.role] = user;
  }
  console.log('   ✅ Auth Users verified');

  // 2. Classes
  const classDefs = [
    { name: 'Grade 9', code: 'GR09', sections: [{ name: 'A', capacity: 35 }, { name: 'B', capacity: 35 }] },
    { name: 'Grade 10', code: 'GR10', sections: [{ name: 'A', capacity: 35 }, { name: 'B', capacity: 35 }] },
    { name: 'Grade 11', code: 'GR11', sections: [{ name: 'A', capacity: 30 }, { name: 'B', capacity: 30 }] },
    { name: 'Grade 12', code: 'GR12', sections: [{ name: 'A', capacity: 30 }, { name: 'B', capacity: 30 }] },
  ];

  const seededClasses = [];
  for (const cd of classDefs) {
    let c = await Class.findOne({ code: cd.code });
    if (!c) {
      c = await Class.create(cd);
    }
    seededClasses.push(c);
  }
  console.log(`   ✅ Classes verified (${seededClasses.length} classes)`);

  // 2b. Subjects
  const subjectDefs = [
    { name: 'Mathematics', code: 'MATH-10', department: 'Mathematics', weeklyPeriods: 6, credits: 4 },
    { name: 'Physics', code: 'PHY-10', department: 'Natural Sciences', weeklyPeriods: 5, credits: 4, type: 'both' },
    { name: 'Chemistry', code: 'CHEM-10', department: 'Natural Sciences', weeklyPeriods: 5, credits: 4, type: 'both' },
    { name: 'English Literature', code: 'ENG-10', department: 'Humanities & Languages', weeklyPeriods: 4, credits: 3 },
    { name: 'Computer Science', code: 'CS-10', department: 'Information Technology', weeklyPeriods: 5, credits: 4, type: 'both' },
  ];

  for (const s of subjectDefs) {
    const existing = await Subject.findOne({ code: s.code });
    if (!existing) {
      await Subject.create(s);
    }
  }
  console.log('   ✅ Academic Subjects verified');

  // 3. Teachers
  let teacherDoc = await Teacher.findOne({ employeeId: 'FAC-101' });
  if (!teacherDoc) {
    teacherDoc = await Teacher.create({
      user: seededUsers.teacher._id,
      employeeId: 'FAC-101',
      specialization: 'Senior Mathematics & Calculus',
      qualification: 'M.Sc. Mathematics, B.Ed.',
      assignedClasses: [
        { class: seededClasses[1]._id, section: 'A', subject: 'Mathematics' },
        { class: seededClasses[1]._id, section: 'B', subject: 'Mathematics' },
      ],
    });
  }
  console.log('   ✅ Faculty records verified');

  // 4. Students
  const studentNames = [
    { name: 'Alexander Wright', adm: 'SCH-2024-001', roll: '10A-01', classIdx: 1, sec: 'A' },
    { name: 'Sophia Chen', adm: 'SCH-2024-002', roll: '10A-02', classIdx: 1, sec: 'A' },
    { name: 'Marcus Brody', adm: 'SCH-2024-003', roll: '10A-03', classIdx: 1, sec: 'A' },
    { name: 'Elena Rostova', adm: 'SCH-2024-004', roll: '10A-04', classIdx: 1, sec: 'A' },
    { name: 'Tariq Al-Mansoor', adm: 'SCH-2024-005', roll: '10B-01', classIdx: 1, sec: 'B' },
    { name: 'Charlotte Dubois', adm: 'SCH-2024-006', roll: '10B-02', classIdx: 1, sec: 'B' },
    { name: 'Arjun Mehta', adm: 'SCH-2024-007', roll: '09A-01', classIdx: 0, sec: 'A' },
    { name: 'Priya Sharma', adm: 'SCH-2024-008', roll: '09A-02', classIdx: 0, sec: 'A' },
    { name: 'Lucas Silva', adm: 'SCH-2024-009', roll: '11A-01', classIdx: 2, sec: 'A' },
    { name: 'Hannah Abbott', adm: 'SCH-2024-010', roll: '12A-01', classIdx: 3, sec: 'A' },
  ];

  const seededStudents = [];
  for (const s of studentNames) {
    let student = await Student.findOne({ admissionNumber: s.adm });
    if (!student) {
      student = await Student.create({
        name: s.name,
        admissionNumber: s.adm,
        rollNumber: s.roll,
        class: seededClasses[s.classIdx]._id,
        section: s.sec,
        gender: s.name.endsWith('a') || s.name.endsWith('ah') ? 'female' : 'male',
        guardian: seededUsers.guardian._id,
        status: 'active',
      });
    }
    seededStudents.push(student);
  }
  console.log(`   ✅ Students verified (${seededStudents.length} students)`);

  // 5. Attendance Records (Last 7 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - i);

    for (const st of seededStudents) {
      const existing = await Attendance.findOne({
        student: st._id,
        date: targetDate,
        session: 'daily',
      });

      if (!existing) {
        const rand = Math.random();
        const status = rand > 0.1 ? 'present' : rand > 0.04 ? 'late' : 'absent';

        await Attendance.create({
          student: st._id,
          class: st.class,
          section: st.section,
          date: targetDate,
          session: 'daily',
          status,
          recordedBy: seededUsers.teacher._id,
        });
      }
    }
  }
  console.log('   ✅ 7-Day Attendance records verified');

  // 6. Fee Invoices
  const invoiceDefs = [
    { adm: 'SCH-2024-001', inv: 'INV-2024-001', amount: 45000, paid: 45000, status: 'paid' },
    { adm: 'SCH-2024-002', inv: 'INV-2024-002', amount: 45000, paid: 25000, status: 'partial' },
    { adm: 'SCH-2024-003', inv: 'INV-2024-003', amount: 45000, paid: 45000, status: 'paid' },
    { adm: 'SCH-2024-004', inv: 'INV-2024-004', amount: 45000, paid: 45000, status: 'paid' },
    { adm: 'SCH-2024-005', inv: 'INV-2024-005', amount: 45000, paid: 0, status: 'pending' },
    { adm: 'SCH-2024-006', inv: 'INV-2024-006', amount: 45000, paid: 45000, status: 'paid' },
    { adm: 'SCH-2024-007', inv: 'INV-2024-007', amount: 42000, paid: 42000, status: 'paid' },
    { adm: 'SCH-2024-008', inv: 'INV-2024-008', amount: 42000, paid: 21000, status: 'partial' },
    { adm: 'SCH-2024-009', inv: 'INV-2024-009', amount: 48000, paid: 48000, status: 'paid' },
    { adm: 'SCH-2024-010', inv: 'INV-2024-010', amount: 50000, paid: 0, status: 'overdue' },
  ];

  for (const id of invoiceDefs) {
    const student = seededStudents.find((s) => s.admissionNumber === id.adm);
    if (student) {
      const existing = await Invoice.findOne({ invoiceNumber: id.inv });
      if (!existing) {
        const due = new Date();
        due.setDate(due.getDate() + 15);
        await Invoice.create({
          invoiceNumber: id.inv,
          student: student._id,
          amount: id.amount,
          paidAmount: id.paid,
          status: id.status,
          dueDate: due,
          academicTerm: 'Term 1 (2024-2025)',
        });
      }
    }
  }
  console.log('   ✅ Fee Invoices verified');

  // 7. Audit Logs
  const auditLogs = [
    {
      action: 'USER_LOGIN',
      details: 'Administrator Arthur Vance authenticated from 192.168.1.104',
      userName: 'Dr. Arthur Vance',
      userRole: 'admin',
    },
    {
      action: 'ATTENDANCE_RECORDED',
      details: 'Daily classroom attendance submitted for Grade 10-A (96.4% present)',
      userName: 'Clara Oswald',
      userRole: 'teacher',
    },
    {
      action: 'FEE_PAYMENT_RECORDED',
      details: 'Simulated fee payment of ₹45,000 reconciled for Alexander Wright (INV-2024-001)',
      userName: 'System Bursar',
      userRole: 'admin',
    },
    {
      action: 'STUDENT_ENROLLED',
      details: 'Enrolled student Sophia Chen into Grade 10-A with Admission #SCH-2024-002',
      userName: 'Dr. Arthur Vance',
      userRole: 'admin',
    },
    {
      action: 'SYSTEM_CONFIG_UPDATED',
      details: 'Configured academic grading thresholds for AY 2024-2025 Term 1',
      userName: 'Dr. Arthur Vance',
      userRole: 'admin',
    },
  ];

  for (const log of auditLogs) {
    const existing = await AuditLog.findOne({ details: log.details });
    if (!existing) {
      await AuditLog.create(log);
    }
  }
  console.log('   ✅ Audit Trail logs verified');
  console.log('🎉  All SCHOLARA demo data seeded successfully.');
};

export const seedAuthUsers = seedAllData;

const run = async () => {
  await connectDB();
  await seedAllData();
  await mongoose.disconnect();
  process.exit(0);
};

if (process.argv[1]?.endsWith('seed.js')) {
  run().catch((err) => {
    console.error('Seed error:', err.message);
    process.exit(1);
  });
}
