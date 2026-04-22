import { command, form, query } from '$app/server';
import {
	MaintenanceRecord,
	createRecordFormSchema,
	updateRecordFormSchema,
	deleteRecordSchema
} from '$lib/schemas/maintenance-record';
import { getOrganizationContext } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import { sql } from 'kysely';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';

async function ensureVehicleBelongsToOrganization(organizationId: string, vehicleId: string) {
	const vehicle = await db
		.selectFrom('vehicle')
		.select('id')
		.where('id', '=', vehicleId)
		.where('organization_id', '=', organizationId)
		.executeTakeFirst();

	if (!vehicle) {
		error(400, 'Selected vehicle does not belong to this organization');
	}
}

async function findOrCreateCategory(organizationId: string, name: string): Promise<string> {
	const trimmed = name.trim();
	const lower = trimmed.toLowerCase();

	const existing = await db
		.selectFrom('maintenance_category')
		.select('id')
		.where('organization_id', '=', organizationId)
		.where(sql<string>`LOWER(name)`, '=', lower)
		.executeTakeFirst();

	if (existing) return existing.id;

	const id = crypto.randomUUID();
	await db
		.insertInto('maintenance_category')
		.values({ id, organization_id: organizationId, name: trimmed, created_at: new Date() })
		.execute();

	return id;
}

const toRecord = (row: {
	id: string;
	vehicle_id: string;
	organization_id: string;
	type: string;
	date: Date;
	odometer_km: number | null;
	workshop: string | null;
	category_id: string | null;
	category_name: string | null;
	reported_problem: string | null;
	cost: string | null;
	notes: string | null;
	created_at: Date;
	updated_at: Date;
}): MaintenanceRecord => {
	return v.parse(MaintenanceRecord, {
		id: row.id,
		vehicleId: row.vehicle_id,
		organizationId: row.organization_id,
		type: row.type,
		date: row.date,
		odometerKm: row.odometer_km,
		workshop: row.workshop,
		categoryId: row.category_id,
		categoryName: row.category_name,
		reportedProblem: row.reported_problem,
		cost: row.cost !== null ? parseFloat(row.cost) : null,
		notes: row.notes,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	});
};

const getRecordsSchema = v.object({
	organizationSlug: v.string(),
	vehicleId: v.optional(v.string())
});

export const getRecords = query(getRecordsSchema, async ({ organizationSlug, vehicleId }) => {
	const { organizationId } = await getOrganizationContext(organizationSlug);

	let q = db
		.selectFrom('maintenance_record')
		.leftJoin('maintenance_category', 'maintenance_category.id', 'maintenance_record.category_id')
		.select([
			'maintenance_record.id',
			'maintenance_record.vehicle_id',
			'maintenance_record.organization_id',
			'maintenance_record.type',
			'maintenance_record.date',
			'maintenance_record.odometer_km',
			'maintenance_record.workshop',
			'maintenance_record.category_id',
			'maintenance_category.name as category_name',
			'maintenance_record.reported_problem',
			'maintenance_record.cost',
			'maintenance_record.notes',
			'maintenance_record.created_at',
			'maintenance_record.updated_at'
		])
		.where('maintenance_record.organization_id', '=', organizationId);

	if (vehicleId) {
		q = q.where('maintenance_record.vehicle_id', '=', vehicleId);
	}

	const rows = await q.orderBy('maintenance_record.date', 'desc').execute();
	return rows.map(toRecord);
});

const getRecordSchema = v.object({
	organizationSlug: v.string(),
	id: v.string()
});

export const getRecord = query(getRecordSchema, async ({ organizationSlug, id }) => {
	const { organizationId } = await getOrganizationContext(organizationSlug);

	const row = await db
		.selectFrom('maintenance_record')
		.leftJoin('maintenance_category', 'maintenance_category.id', 'maintenance_record.category_id')
		.select([
			'maintenance_record.id',
			'maintenance_record.vehicle_id',
			'maintenance_record.organization_id',
			'maintenance_record.type',
			'maintenance_record.date',
			'maintenance_record.odometer_km',
			'maintenance_record.workshop',
			'maintenance_record.category_id',
			'maintenance_category.name as category_name',
			'maintenance_record.reported_problem',
			'maintenance_record.cost',
			'maintenance_record.notes',
			'maintenance_record.created_at',
			'maintenance_record.updated_at'
		])
		.where('maintenance_record.id', '=', id)
		.where('maintenance_record.organization_id', '=', organizationId)
		.executeTakeFirst();

	if (!row) {
		error(404, 'Record not found');
	}

	return toRecord(row);
});

const getCategoriesSchema = v.object({ organizationSlug: v.string() });

export const getCategories = query(getCategoriesSchema, async ({ organizationSlug }) => {
	const { organizationId } = await getOrganizationContext(organizationSlug);

	const rows = await db
		.selectFrom('maintenance_category')
		.select(['id', 'name'])
		.where('organization_id', '=', organizationId)
		.orderBy('name', 'asc')
		.execute();

	return rows;
});

export const createRecord = form(createRecordFormSchema, async (data) => {
	const {
		organizationSlug,
		vehicleId,
		type,
		date,
		odometerKm,
		workshop,
		category,
		reportedProblem,
		cost,
		notes
	} = data;
	const { organizationId } = await getOrganizationContext(organizationSlug);
	await ensureVehicleBelongsToOrganization(organizationId, vehicleId);

	const categoryId = category?.trim() ? await findOrCreateCategory(organizationId, category) : null;

	const id = crypto.randomUUID();

	await db
		.insertInto('maintenance_record')
		.values({
			id,
			vehicle_id: vehicleId,
			organization_id: organizationId,
			type,
			date,
			odometer_km: odometerKm ?? null,
			workshop: workshop || null,
			category_id: categoryId,
			reported_problem: reportedProblem || null,
			cost: cost ?? null,
			notes: notes || null,
			created_at: new Date(),
			updated_at: new Date()
		})
		.execute();

	if (odometerKm) {
		await db
			.updateTable('vehicle')
			.set({ current_km: odometerKm, updated_at: new Date() })
			.where('id', '=', vehicleId)
			.where('organization_id', '=', organizationId)
			.where('current_km', '<', odometerKm)
			.execute();
	}

	await Promise.all([
		getRecords({ organizationSlug }).refresh(),
		getCategories({ organizationSlug }).refresh(),
		...(vehicleId ? [getRecords({ organizationSlug, vehicleId }).refresh()] : [])
	]);

	return { success: true, id };
});

export const updateRecord = form(updateRecordFormSchema, async (data) => {
	const {
		organizationSlug,
		id,
		vehicleId,
		type,
		date,
		odometerKm,
		workshop,
		category,
		reportedProblem,
		cost,
		notes
	} = data;
	const { organizationId } = await getOrganizationContext(organizationSlug);

	if (vehicleId !== undefined) {
		await ensureVehicleBelongsToOrganization(organizationId, vehicleId);
	}

	const updates: Record<string, unknown> = { updated_at: new Date() };
	if (vehicleId !== undefined) updates.vehicle_id = vehicleId;
	if (type !== undefined) updates.type = type;
	if (date !== undefined) updates.date = date;
	if (odometerKm !== undefined) updates.odometer_km = odometerKm ?? null;
	if (workshop !== undefined) updates.workshop = workshop || null;
	if (category !== undefined) {
		updates.category_id = category?.trim()
			? await findOrCreateCategory(organizationId, category)
			: null;
	}
	if (reportedProblem !== undefined) updates.reported_problem = reportedProblem || null;
	if (cost !== undefined) updates.cost = cost ?? null;
	if (notes !== undefined) updates.notes = notes || null;

	const result = await db
		.updateTable('maintenance_record')
		.set(updates)
		.where('id', '=', id)
		.where('organization_id', '=', organizationId)
		.returningAll()
		.execute();

	if (result.length === 0) {
		error(404, 'Record not found');
	}

	const row = result[0];
	await Promise.all([
		getRecords({ organizationSlug }).refresh(),
		getRecords({ organizationSlug, vehicleId: row.vehicle_id }).refresh(),
		getRecord({ organizationSlug, id }).refresh(),
		getCategories({ organizationSlug }).refresh()
	]);

	return { success: true };
});

export const deleteRecord = command(deleteRecordSchema, async ({ organizationSlug, id }) => {
	const { organizationId } = await getOrganizationContext(organizationSlug);

	const deleted = await db
		.deleteFrom('maintenance_record')
		.where('id', '=', id)
		.where('organization_id', '=', organizationId)
		.returningAll()
		.execute();

	if (deleted.length === 0) {
		error(404, 'Record not found');
	}

	await Promise.all([
		getRecords({ organizationSlug }).refresh(),
		getRecords({ organizationSlug, vehicleId: deleted[0].vehicle_id }).refresh()
	]);

	return { success: true };
});
