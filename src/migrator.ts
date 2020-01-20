/* eslint-disable @typescript-eslint/no-empty-function */
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

/**
 * Abstract migrator base class.
 */
export abstract class Migrator<T> {
  protected _migrations: Array<Migration<T>>;

  constructor(migrations: Array<Migration<T>>) {
    this._migrations = [...migrations];
    this._migrations.sort((a: Migration<T>, b: Migration<T>) => a.id - b.id);
    if (this._migrations.length > 0 && this._migrations[0].id <= 0) {
      throw new Error('Smallest migration ID should be equal or greater than 1.');
    }
  }

  /** Applies all unapplied migrations. */
  public async up(): Promise<void> {
    await this.onInitialize();

    const lastRunMigration: number = await this.getLast();
    const unappliedMigrations = this._migrations
      .filter((migration: Migration<T>) => migration.id > lastRunMigration);

    const reducer = (
      promise: Promise<void>,
      migration: Migration<T>,
    ): Promise<void> => promise.then(() => this._apply(migration));
    return unappliedMigrations.reduce(reducer, Promise.resolve());
  }

  /** Called when the migrator is starting. */
  protected async onInitialize(): Promise<void> {

  }

  /** Returns the ID of the last applied migration. */
  protected abstract async getLast(): Promise<number>;

  /** Called to run a migration. */
  protected abstract async onMigrate(migration: Migration<T>): Promise<void>;

  /** Called before a migration is run. */
  protected async onBeforeMigration(): Promise<void> {}

  /**
   * Called if the migration threw an error. Can be used to roll back
   * a transaction.
   */
  protected async onCancel(): Promise<void> {}

  /**
   * Called after a migration is run regardless of whether it threw an error.
   */
  protected async onAfterMigration(): Promise<void> {}

  /** Runs a migration. */
  private async _apply(migration: Migration<T>): Promise<void> {
    await this.onBeforeMigration();
    try {
      await this.onMigrate(migration);
    } catch (e) {
      await this.onCancel();
      throw e;
    } finally {
      await this.onAfterMigration();
    }
  }
}
