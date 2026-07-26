import { sql } from 'kysely';

import { db } from '#/lib/db/index.ts';

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

async function findUserById(userId: string): Promise<UserRow | undefined> {
  const result = await sql<UserRow>`
    select id, name, email, image
    from "user"
    where id = ${userId}
    limit 1
  `.execute(db);

  return result.rows[0];
}

async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const result = await sql<UserRow>`
    select id, name, email, image
    from "user"
    where lower(email) = ${email}
    limit 1
  `.execute(db);

  return result.rows[0];
}

export { findUserByEmail, findUserById, type UserRow };
