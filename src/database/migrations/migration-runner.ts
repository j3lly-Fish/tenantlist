import { Pool } from 'pg';
import pool from '../../config/database';

export interface Migration {
  name: string;
  up: (pool: Pool) => Promise<void>;
  down: (pool: Pool) => Promise<void>;
}

export class MigrationRunner {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await this.pool.query(query);
  }

  async hasRun(migrationName: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM migrations WHERE name = $1',
      [migrationName]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async markAsRun(migrationName: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [migrationName]
    );
  }

  async unmarkAsRun(migrationName: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM migrations WHERE name = $1',
      [migrationName]
    );
  }

  async runMigration(migration: Migration): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const hasRun = await this.hasRun(migration.name);
      if (hasRun) {
        console.log(`Migration ${migration.name} already executed, skipping.`);
        await client.query('COMMIT');
        return;
      }

      console.log(`Running migration: ${migration.name}`);
      await migration.up(this.pool);
      await this.markAsRun(migration.name);

      await client.query('COMMIT');
      console.log(`Migration ${migration.name} completed successfully.`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Migration ${migration.name} failed:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async rollbackMigration(migration: Migration): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const hasRun = await this.hasRun(migration.name);
      if (!hasRun) {
        console.log(`Migration ${migration.name} not executed, skipping rollback.`);
        await client.query('COMMIT');
        return;
      }

      console.log(`Rolling back migration: ${migration.name}`);
      await migration.down(this.pool);
      await this.unmarkAsRun(migration.name);

      await client.query('COMMIT');
      console.log(`Migration ${migration.name} rolled back successfully.`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Rollback of ${migration.name} failed:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async runMigrations(migrations: Migration[]): Promise<void> {
    await this.createMigrationsTable();

    for (const migration of migrations) {
      await this.runMigration(migration);
    }
  }

  async rollbackMigrations(migrations: Migration[]): Promise<void> {
    for (const migration of migrations.reverse()) {
      await this.rollbackMigration(migration);
    }
  }
}
