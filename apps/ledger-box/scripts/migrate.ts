import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FileMigrationProvider, Migrator } from 'kysely/migration';

import { db } from '../src/lib/db/index.ts';

const migrationFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/lib/db/migrations');

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({ fs, path, migrationFolder }),
});

async function main() {
  const direction = process.argv[2];

  const { error, results } = direction === 'down' ? await migrator.migrateDown() : await migrator.migrateToLatest();

  for (const result of results ?? []) {
    if (result.status === 'Success') {
      console.log(`✓ ${result.migrationName}`);
    } else if (result.status === 'Error') {
      console.error(`✗ ${result.migrationName}`);
    }
  }

  if (error) {
    console.error(error);
    process.exitCode = 1;
  }

  await db.destroy();
}

await main();
