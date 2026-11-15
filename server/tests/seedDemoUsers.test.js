import { jest } from '@jest/globals';
import { getDatabaseName, seedDemoUsers } from '../src/utils/seedDemoUsers.js';

const scholaraUri = 'mongodb://localhost:27017/scholara';

const createConnection = () => ({
  db: {
    databaseName: 'scholara',
  },
});

describe('scoped demo-user seeder', () => {
  it('requires the exact scholara database name', () => {
    expect(() => getDatabaseName()).toThrow(/MONGODB_URI must be configured/i);
    expect(() => getDatabaseName('mongodb://localhost:27017/other')).toThrow(/scholara/i);
    expect(getDatabaseName(scholaraUri)).toBe('scholara');
  });

  it('creates only missing demo users', async () => {
    const existingEmails = new Set(['teacher@scholara.edu']);
    const createdUsers = [];
    const logger = { log: jest.fn() };
    const userModel = {
      findOne: jest.fn(async ({ email }) => (
        existingEmails.has(email) ? { _id: `existing-${email}` } : null
      )),
      create: jest.fn(async (user) => {
        createdUsers.push(user);
        return user;
      }),
    };

    await seedDemoUsers({
      uri: scholaraUri,
      connect: jest.fn(async () => {}),
      connection: createConnection(),
      userModel,
      logger,
    });

    expect(userModel.findOne).toHaveBeenCalledTimes(3);
    expect(userModel.create).toHaveBeenCalledTimes(2);
    expect(createdUsers.map(({ email }) => email)).toEqual([
      'admin@scholara.edu',
      'guardian@scholara.edu',
    ]);
    expect(createdUsers.map(({ name, role, password }) => ({ name, role, password }))).toEqual([
      { name: 'SCHOLARA Administrator', role: 'admin', password: 'Admin@123' },
      { name: 'SCHOLARA Guardian', role: 'guardian', password: 'Guardian@123' },
    ]);
    expect(logger.log).toHaveBeenCalledWith(
      'Skipped demo account: teacher@scholara.edu (teacher)',
    );
    expect(userModel.findOne.mock.calls.every(([query]) => (
      query.email === query.email.trim().toLowerCase()
    ))).toBe(true);
  });

  it('refuses to connect when the URI targets another database', async () => {
    const connect = jest.fn();

    await expect(seedDemoUsers({
      uri: 'mongodb://localhost:27017/not-scholara',
      connect,
      connection: createConnection(),
      userModel: { findOne: jest.fn(), create: jest.fn() },
    })).rejects.toThrow(/scholara/i);

    expect(connect).not.toHaveBeenCalled();
  });

  it('refuses to write when the connected database is not scholara', async () => {
    const userModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    await expect(seedDemoUsers({
      uri: scholaraUri,
      connect: jest.fn(async () => {}),
      connection: { db: { databaseName: 'another-database' } },
      userModel,
    })).rejects.toThrow(/scholara/i);

    expect(userModel.findOne).not.toHaveBeenCalled();
    expect(userModel.create).not.toHaveBeenCalled();
  });
});
