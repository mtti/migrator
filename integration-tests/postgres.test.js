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
