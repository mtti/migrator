/*
Copyright 2018-2019 Matti Hiltunen

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

import { IMigration, Migrator } from './migrator';

function createDummyMigrations(count: number): Array<IMigration<void>> {
  const result: Array<IMigration<void>> = [];

  for (let i = 0; i < count; i++) {
    result.push({
      id: i,
      up: jest.fn().mockResolvedValue(null),
    });
  }

  return result;
}

class DummyMigrator extends Migrator<void> {
  private _last: number;

  constructor(migrations: Array<IMigration<void>>, last: number) {
    super(migrations);
    this._last = last;
  }

  protected async getLast(): Promise<number> {
    return this._last;
  }

  protected async onMigrate(migration: IMigration<void>): Promise<void> {
    await migration.up();
    return;
  }
}

describe('Migrator', () => {
  let migrator: DummyMigrator;
  let migrations: Array<IMigration<void>>;

  describe('up()', () => {
    describe('partially applied array of migrations', () => {
      beforeEach(async () => {
        migrations = createDummyMigrations(3);
        migrator = new DummyMigrator(migrations, 1);
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
  });
});
