A pragmatic database migration utility. Designed mainly for PostgreSQL but extendable for use with probably any database.

Written in TypeScript but intended to be usable from plain JavaScript. The compiled JavaScript targets Node 8.10, which is the newest version supported by AWS Lambda.

## Overview

This library is designed based on three assumptions:

1. You have some pieces of code that mutate your database schema somehow.
2. These pieces of code need to be run in a certain order.
3. Each piece of code should only be run once.

These *pieces of code* for the purposes of this library are objects implementing the `IMigration<T>` interface:

```TypeScript
export interface IMigration<T> {
  id: number;
  up: (client: T) => Promise<void>;
}
```

* `T` is the type of the database-specific client.
* `id` is the sequence number of the migration which must be `>=1`.
* `up` is a function which takes the database client as a parameter, mutates the database using that client and returns a `Promise<void>`.

Migrations are run by *migrators*, subclasses of the abstract base class `Migrator<T>`.

## PostgreSQL

A PostgreSQL-specific migrator is included with this library, called `PostgresMigrator` which extends `Migrator<PoolClient>` and accepts an array of `IMigration<PoolClient>` objects. It stores the ID of the last executed migration in a table called `migrations` (the name is hardcoded for now).

When run, the migrator will attempt to create this table with the schema

```SQL
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    last INTEGER DEFAULT 0
);
```

and insert one row to store that migration ID:

```SQL
INSERT INTO migrations (id, last) VALUES (0, 0) ON CONFLICT DO NOTHING;
```

Migrations are run each in their own transaction. Incrementing the `last` migration ID is done inside the same transaction. If the migration function throws an error, the transaction is rolled back.

## Tests

Included are some basic unit tests for the basic logic of `Migrator<T>` as well as some simple integration tests for `PostgresMigrator` which require a PostgreSQL database from the `docker-compose.yml` file to be running.

## License

Released under the Apache License, version 2.0.
