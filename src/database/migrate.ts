import { MigrationRunner } from './migrations/migration-runner';
import { migrations } from './migrations';
import pool from '../config/database';

async function runMigrations() {
  const runner = new MigrationRunner(pool);

  try {
    console.log('Starting migrations...');
    await runner.runMigrations(migrations);
    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function rollbackMigrations() {
  const runner = new MigrationRunner(pool);

  try {
    console.log('Starting rollback...');
    await runner.rollbackMigrations(migrations);
    console.log('All migrations rolled back successfully.');
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const command = process.argv[2];

if (command === 'up') {
  runMigrations();
} else if (command === 'down') {
  rollbackMigrations();
} else {
  console.log('Usage: npm run migrate:up or npm run migrate:down');
  process.exit(1);
}
