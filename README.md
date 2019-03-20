Simple database migration utility written in TypeScript.

Contains an abstract base class `Migrator<T>` which can be extended to support other database systems, as well as `PostgresMigrator` for use with PostgreSQL. Migrations themselves are objects with a numeric `id` and a function `up(T)` which applies the migration. The `up` function is intended to receive a database-specific client object as a parameter, which is why the `PostgresMigrator` class extends `Migrator<PoolClient>`.

The PostgreSQL migrator stores the ID of the newest applied migration in a table called `migrations` (the name is hardcoded for now). Each Postgres migration is executed in its own transaction
