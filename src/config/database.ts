import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const isTestEnvironment = process.env.NODE_ENV === 'test';

const poolConfig: PoolConfig = {
  host: isTestEnvironment
    ? (process.env.TEST_DATABASE_HOST || 'localhost')
    : (process.env.DATABASE_HOST || 'localhost'),
  port: isTestEnvironment
    ? parseInt(process.env.TEST_DATABASE_PORT || '5433', 10)
    : parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: isTestEnvironment
    ? (process.env.TEST_DATABASE_NAME || 'zyx_test')
    : (process.env.DATABASE_NAME || 'zyx_development'),
  user: isTestEnvironment
    ? (process.env.TEST_DATABASE_USER || 'postgres')
    : (process.env.DATABASE_USER || 'postgres'),
  password: isTestEnvironment
    ? (process.env.TEST_DATABASE_PASSWORD || 'postgres')
    : (process.env.DATABASE_PASSWORD || 'postgres'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

export default pool;
