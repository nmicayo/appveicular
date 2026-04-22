import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins';
import type { Kysely } from 'kysely';
import type { DB } from './db/db.types';
import { db } from './db';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';

export const createAuth = (db: Kysely<DB>) =>
	betterAuth({
		database: {
			type: 'postgres',
			db
		},
		emailAndPassword: {
			enabled: true
		},
		plugins: [sveltekitCookies(getRequestEvent), organization()]
	});

export const auth = createAuth(db);
