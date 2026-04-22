#!/usr/bin/env bun

import { existsSync, readFileSync } from 'node:fs';

const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	blue: '\x1b[34m',
	yellow: '\x1b[33m',
	red: '\x1b[31m'
};

const MIGRATION_DIR = 'file://migrations';
const REVISION_SCHEMA = 'public';

function log(message: string, color = colors.reset) {
	console.log(`${color}${message}${colors.reset}`);
}

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

function printHelp() {
	console.log(`Database Migration Tool using Atlas

Usage: bun run scripts/apply-migration.ts [command] [options]

Commands:
  apply [n]         Apply pending migrations (optionally limit to n files)
  dry-run           Preview migrations without applying them
  status            Show current migration status
  baseline <ver>    Apply with baseline version (for existing databases)
  allow-dirty       Apply to non-clean database (use with caution)
  help              Show this help message

Environment Variables:
  DATABASE_URL      Required. PostgreSQL connection string

Examples:
  bun run scripts/apply-migration.ts
  bun run scripts/apply-migration.ts apply 2
  bun run scripts/apply-migration.ts dry-run
  bun run scripts/apply-migration.ts status
  bun run scripts/apply-migration.ts baseline 20250815170516

Notes:
  - Migrations are stored in: ${MIGRATION_DIR}
  - Migration history is tracked in: ${REVISION_SCHEMA}.atlas_schema_revisions
  - Use 'dry-run' to preview changes before applying to production
`);
}

async function main() {
	const databaseUrl = getEnvValue('DATABASE_URL');
	if (!databaseUrl) {
		log('Error: DATABASE_URL is not set. Please configure it in .env.', colors.red);
		process.exit(1);
	}

	const command = Bun.argv[2] ?? 'apply';
	const option = Bun.argv[3];

	switch (command) {
		case 'apply': {
			log('Applying pending migrations...', colors.blue);
			const args = [
				'migrate',
				'apply',
				...(option ? [option] : []),
				'--url',
				databaseUrl,
				'--dir',
				MIGRATION_DIR,
				'--revisions-schema',
				REVISION_SCHEMA
			];

			if (option) {
				log(`Limiting to ${option} migration(s)`, colors.yellow);
			}

			await runAtlas(args);
			log('Migrations applied successfully', colors.green);
			break;
		}

		case 'dry-run': {
			log('Performing dry run (preview only)...', colors.blue);
			await runAtlas([
				'migrate',
				'apply',
				'--url',
				databaseUrl,
				'--dir',
				MIGRATION_DIR,
				'--revisions-schema',
				REVISION_SCHEMA,
				'--dry-run'
			]);
			log('This was a dry run. No changes were applied.', colors.yellow);
			break;
		}

		case 'status': {
			log('Checking migration status...', colors.blue);
			await runAtlas([
				'migrate',
				'status',
				'--url',
				databaseUrl,
				'--dir',
				MIGRATION_DIR,
				'--revisions-schema',
				REVISION_SCHEMA
			]);
			break;
		}

		case 'baseline': {
			if (!option) {
				log('Error: Baseline version required', colors.red);
				console.log('Usage: bun run scripts/apply-migration.ts baseline <version>');
				process.exit(1);
			}

			log(`Applying migrations with baseline ${option}...`, colors.blue);
			await runAtlas([
				'migrate',
				'apply',
				'--url',
				databaseUrl,
				'--dir',
				MIGRATION_DIR,
				'--revisions-schema',
				REVISION_SCHEMA,
				'--baseline',
				option
			]);
			log('Migrations applied with baseline', colors.green);
			break;
		}

		case 'allow-dirty': {
			log('Applying migrations to non-clean database...', colors.yellow);
			await runAtlas([
				'migrate',
				'apply',
				'--url',
				databaseUrl,
				'--dir',
				MIGRATION_DIR,
				'--revisions-schema',
				REVISION_SCHEMA,
				'--allow-dirty'
			]);
			log('Migrations applied (allow-dirty mode)', colors.green);
			break;
		}

		case 'help':
		case '--help':
		case '-h': {
			printHelp();
			break;
		}

		default: {
			log(`Error: Unknown command '${command}'`, colors.red);
			console.log("Use 'bun run scripts/apply-migration.ts help' for usage information");
			process.exit(1);
		}
	}

	if (command === 'apply' || command === 'baseline' || command === 'allow-dirty') {
		console.log('');
		log('Next steps:', colors.yellow);
		console.log('1. Run \"bun run gentypes\" to regenerate TypeScript types');
		console.log('2. Run \"bun run db:migrate:status\" to verify migration status');
		console.log('3. Test your application to ensure everything works');
	}
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	log(`Error: ${message}`, colors.red);
	process.exit(1);
});
