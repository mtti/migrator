/*
Copyright 2019-2020 Matti Hiltunen

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Pool, PoolClient } from 'pg';
import { Migration } from './Migration';
import { Migrator } from './migrator';

export class PostgresMigrator extends Migrator<PoolClient> {
  private _pool: Pool;

  private _client?: PoolClient;

  protected get client(): PoolClient {
    if (this._client) {
      return this._client;
    }
    throw new Error('Client not initialized');
  }

  constructor(pool: Pool, migrations: Array<Migration<PoolClient>>) {
    super(migrations);
    this._pool = pool;
  }

  protected async onInitialize(): Promise<void> {
    await this._pool.query('CREATE TABLE IF NOT EXISTS migrations (id SERIAL PRIMARY KEY, last INTEGER DEFAULT 0);');
    await this._pool.query('INSERT INTO migrations (id, last) VALUES (0, 0) ON CONFLICT DO NOTHING;');
  }

  protected async getLast(): Promise<number> {
    const client = await this._pool.connect();
    try {
      const { rows } = await client.query('SELECT last FROM migrations WHERE id = 0;');
      return rows[0].last;
    } finally {
      client.release();
    }
  }

  protected async onBeforeMigration(): Promise<void> {
    this._client = await this._pool.connect();
  }

  protected async onMigrate(migration: Migration<PoolClient>): Promise<void> {
    await this.client.query('BEGIN;');
    await migration.up(this.client);
    await this.client.query('UPDATE migrations SET last = $1 WHERE id = 0;', [migration.id]);
    await this.client.query('COMMIT;');
  }

  protected async onCancel(): Promise<void> {
    await this.client.query('ROLLBACK;');
  }

  protected async onAfterMigration(): Promise<void> {
    this.client.release();
    this._client = undefined;
  }
}
