import type { DB } from './db.types';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { env } from '$env/dynamic/private';

const dialect = new PostgresDialect({
	pool: new Pool({
		connectionString: env.DATABASE_URL
	})
});

export const db = new Kysely<DB>({
	dialect
});
