/*
Copyright 2019 Matti Hiltunen

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

const { Pool } = require('pg');
const { PostgresMigrator } = require('../dist/postgres');

async function clean(pool) {
  const queries = [
    'DROP TABLE IF EXISTS migrations;',
  ];
  for (let i = 0; i < queries.length; i += 1) {
    await pool.query(queries[i]);
  }
}

async function getLast(pool) {
  const { rows } = await pool.query('SELECT last FROM migrations WHERE id = 0;');
  return rows[0].last;
}

describe('PostgresMigrator', () => {
  let pool;
  let firstMigration;
  let secondMigration;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: 'postgresql://tester:password@localhost:5432/node_migrator_test',
    });
    await clean(pool);
  });

  afterAll(async () => {
    await clean(pool);
    await pool.end();
  });

  beforeEach(() => {
    firstMigration = {
      id: 1,
      up: jest.fn(() => Promise.resolve()),
    };
    secondMigration = {
      id: 2,
      up: jest.fn(() => Promise.resolve()),
    };
  });

  describe('first run one migration, then add another', () => {
    it('run first migration', async () => {
      const migrator = new PostgresMigrator(pool, [firstMigration]);
      await migrator.up();
      const last = await getLast(pool);

      expect(last).toBe(1);
      expect(firstMigration.up).toHaveBeenCalled();
    });

    it('add a second migration', async () => {
      const migrator = new PostgresMigrator(pool, [secondMigration, firstMigration]);
      await migrator.up();
      const last = await getLast(pool);

      expect(last).toBe(2);
      expect(firstMigration.up).not.toHaveBeenCalled();
      expect(secondMigration.up).toHaveBeenCalled();
    });
  });
});
