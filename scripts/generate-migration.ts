#!/usr/bin/env bun

import { existsSync, readFileSync } from 'node:fs';

function unwrapEnvValue(value: string) {
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}

	return value;
}

function getEnvValue(name: string): string | undefined {
	const direct = Bun.env[name] ?? process.env[name];
	if (direct && direct.length > 0) {
		return direct;
	}

	if (!existsSync('.env')) {
		return undefined;
	}

	const content = readFileSync('.env', 'utf8');
	for (const rawLine of content.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (line.length === 0 || line.startsWith('#')) {
			continue;
		}

		const separator = line.indexOf('=');
		if (separator === -1) {
			continue;
		}

		const key = line.slice(0, separator).trim();
		if (key !== name) {
			continue;
		}

		const value = line.slice(separator + 1).trim();
		return unwrapEnvValue(value);
	}

	return undefined;
}

async function runAtlas(args: string[]) {
	const proc = Bun.spawn(['atlas', ...args], {
		stdin: 'inherit',
		stdout: 'inherit',
		stderr: 'inherit',
		env: process.env
	});

	const code = await proc.exited;
	if (code !== 0) {
		throw new Error(`atlas ${args.join(' ')} exited with code ${code}`);
	}
}

async function main() {
	const name = Bun.argv[2];
	if (!name) {
		console.error('Usage: bun run scripts/generate-migration.ts <migration-name>');
		process.exit(1);
	}

	const databaseUrl = getEnvValue('DATABASE_URL');
	if (!databaseUrl) {
		console.error('Error: DATABASE_URL is not set. Please configure it in .env.');
		process.exit(1);
	}

	console.log(`Creating migration '${name}' using dev url from DATABASE_URL...`);
	await runAtlas([
		'migrate',
		'diff',
		name,
		'--dir',
		'file://migrations',
		'--to',
		'file://schema.sql',
		'--dev-url',
		databaseUrl
	]);

	console.log(`Migration '${name}' created successfully. Check the 'migrations' folder.`);
	console.log(
		"Don't forget to run 'bun run gentypes' if your DB schema changed, to keep Kysely types in sync."
	);
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`Error: ${message}`);
	process.exit(1);
});
