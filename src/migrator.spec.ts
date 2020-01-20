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

import { Migration } from './Migration';
import { Migrator } from './migrator';

function createDummyMigrations(count: number): Array<Migration<void>> {
  const result: Array<Migration<void>> = [];

  for (let i = 0; i < count; i += 1) {
    result.push({
      id: i + 1,
      up: jest.fn().mockResolvedValue(null),
    });
  }

  return result;
}

function createFaultyMigration(id: number): Migration<void> {
  return {
    id,
    up: jest.fn(() => { throw new Error('Dummy error'); }),
  };
}

class DummyMigrator extends Migrator<void> {
  private _last: number;

  constructor(migrations: Array<Migration<void>>, last: number) {
    super(migrations);
    this._last = last;
  }

  protected async getLast(): Promise<number> {
    return this._last;
  }

  protected async onMigrate(migration: Migration<void>): Promise<void> {
    await migration.up();
  }
}

describe('Migrator', () => {
  let migrator: DummyMigrator;
  let migrations: Array<Migration<void>>;
  let error: Error|null;

  describe('up()', () => {
    beforeEach(() => {
      error = null;
    });

    describe('smallest migration ID is smaller than 1', () => {
      beforeEach(async () => {
        const migration = {
          id: 0,
          up: (): Promise<void> => Promise.resolve(),
        };
        try {
          migrator = new DummyMigrator([migration], 0);
        } catch (err) {
          error = err;
        }
      });

      it('throws an error', () => {
        expect(error).not.toBeNull();
      });
    });

    describe('some migrations have already been applied', () => {
      beforeEach(async () => {
        migrations = createDummyMigrations(3);
        migrator = new DummyMigrator(migrations, 2);
        await migrator.up();
      });

      it('does not call the first migration', () => {
        expect(migrations[0].up).not.toHaveBeenCalled();
      });

      it('does not call the second migration', () => {
        expect(migrations[1].up).not.toHaveBeenCalled();
      });

      it('calls the third migration', () => {
        expect(migrations[2].up).toHaveBeenCalled();
      });
    });

    describe('when a migration throws', () => {
      beforeEach(async () => {
        migrations = createDummyMigrations(3);
        migrations[1] = createFaultyMigration(2);
        migrator = new DummyMigrator(migrations, 0);
        try {
          await migrator.up();
        } catch (err) {
          error = err;
        }
      });

      it('throws', () => {
        expect(error).not.toBeNull();
      });

      it('does not call the migration after the faulty one', () => {
        expect(migrations[2].up).not.toHaveBeenCalled();
      });
    });
  });
});
