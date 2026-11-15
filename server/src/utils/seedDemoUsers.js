import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import User from '../models/User.js';

const REQUIRED_DATABASE_NAME = 'scholara';

const demoUsers = [
  {
    email: 'admin@scholara.edu',
    password: 'Admin@123',
    name: 'SCHOLARA Administrator',
    role: 'admin',
  },
  {
    email: 'teacher@scholara.edu',
    password: 'Teacher@123',
    name: 'SCHOLARA Teacher',
    role: 'teacher',
  },
  {
    email: 'guardian@scholara.edu',
    password: 'Guardian@123',
    name: 'SCHOLARA Guardian',
    role: 'guardian',
  },
];

export const normalizeEmail = (email) => email.trim().toLowerCase();

export const getDatabaseName = (uri) => {
  if (!uri) {
    throw new Error('MONGODB_URI must be configured.');
  }

  let parsedUri;
  try {
    parsedUri = new URL(uri);
  } catch {
    throw new Error('MONGODB_URI must be a valid MongoDB connection URI.');
  }

  const databaseName = decodeURIComponent(parsedUri.pathname.replace(/^\/+/, ''));
  if (databaseName !== REQUIRED_DATABASE_NAME) {
    throw new Error(`MONGODB_URI must target the "${REQUIRED_DATABASE_NAME}" database.`);
  }

  return databaseName;
};

const assertConnectedDatabase = (connection) => {
  const databaseName = connection?.db?.databaseName;
  if (databaseName !== REQUIRED_DATABASE_NAME) {
    throw new Error(`Connected database must be "${REQUIRED_DATABASE_NAME}".`);
  }
};

export const seedDemoUsers = async ({
  uri = process.env.MONGODB_URI,
  connect = connectDB,
  connection = mongoose.connection,
  userModel = User,
  logger = console,
} = {}) => {
  getDatabaseName(uri);
  await connect();
  assertConnectedDatabase(connection);

  for (const demoUser of demoUsers) {
    const email = normalizeEmail(demoUser.email);
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      logger.log(`Skipped demo account: ${email} (${demoUser.role})`);
      continue;
    }

    await userModel.create({
      ...demoUser,
      email,
    });
    logger.log(`Created demo account: ${email} (${demoUser.role})`);
  }
};

const run = async () => {
  try {
    await seedDemoUsers();
  } catch {
    console.error('Demo-user seeding failed.');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

if (process.argv[1]?.endsWith('seedDemoUsers.js')) {
  run();
}
