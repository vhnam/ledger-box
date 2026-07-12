import { Pool, types } from 'pg';

// pg returns NUMERIC as string by default to avoid precision loss; amounts fit safely in a JS number.
types.setTypeParser(types.builtins.NUMERIC, (value) => Number.parseFloat(value));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
