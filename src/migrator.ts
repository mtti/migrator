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

export interface IMigration<T> {
  id: number;
  up: (client: T) => Promise<void>;
}

/**
 * Abstract migrator base class.
 */
export abstract class Migrator<T> {
  protected _migrations: Array<IMigration<T>>;

  constructor(migrations: Array<IMigration<T>>) {
    this._migrations = [ ...migrations ];
    this._migrations.sort((a: IMigration<T>, b: IMigration<T>) => a.id - b.id);
  }

  /** Applies all unapplied migrations. */
  public async up(): Promise<void> {
    await this.onInitialize();

    const lastRunMigration: number = await this.getLast();
    const unappliedMigrations = this._migrations
      .filter((migration: IMigration<T>) => migration.id > lastRunMigration);

    const reducer = (promise: Promise<void>, migration: IMigration<T>) =>
      promise.then(() => this._apply(migration));
    return unappliedMigrations.reduce(reducer, Promise.resolve());
  }

  /** Called when the migrator is starting. */
  protected async onInitialize(): Promise<void> {
    return;
  }

  /** Returns the ID of the last applied migration. */
  protected abstract async getLast(): Promise<number>;

  /** Called before a migration is run. */
  protected async onBeforeMigration(): Promise<void> {
    return;
  }

  /** Called to run a migration. */
  protected async onMigrate(migration: IMigration<T>): Promise<void> {
    return;
  }

  /** Called if the migration threw an error. Can be used to roll back a transaction. */
  protected async onCancel(): Promise<void> {
    return;
  }

  /** Called after a migration is run regardless of whether it threw an error. */
  protected async onAfterMigration() {
    return;
  }

  /** Runs a migration. */
  private async _apply(migration: IMigration<T>): Promise<void> {
    await this.onBeforeMigration();
    try {
      await this.onMigrate(migration);
    } catch (e) {
      await this.onCancel();
      throw e;
    } finally {
      this.onAfterMigration();
    }
  }
}
