import { command, form, query } from '$app/server';
import {
	MaintenancePlan,
	createPlanFormSchema,
	updatePlanFormSchema,
	deletePlanSchema
} from '$lib/schemas/maintenance-plan';
import { getCategories } from './maintenance-record.remote';
import { getOrganizationContext } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import { sql } from 'kysely';
import { computePlanStatus } from '$lib/utils/plan-calculator';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';

async function getVehicleForOrganization(organizationId: string, vehicleId: string) {
	const vehicle = await db
		.selectFrom('vehicle')
		.select(['id', 'current_km'])
		.where('id', '=', vehicleId)
		.where('organization_id', '=', organizationId)
		.executeTakeFirst();

	if (!vehicle) {
		error(400, 'Selected vehicle does not belong to this organization');
	}

	return vehicle;
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

const toPlan = (row: {
	id: string;
	vehicle_id: string;
	organization_id: string;
	name: string;
	description: string | null;
	category_id: string | null;
	category_name: string | null;
	trigger_type: string;
	trigger_km: number | null;
	trigger_days: number | null;
	lead_time_km: number | null;
	lead_time_days: number | null;
	last_done_km: number | null;
	last_done_date: Date | null;
	next_due_km: number | null;
	next_due_date: Date | null;
	status: string;
	created_at: Date;
	updated_at: Date;
}): MaintenancePlan => {
	return v.parse(MaintenancePlan, {
		id: row.id,
		vehicleId: row.vehicle_id,
		organizationId: row.organization_id,
		name: row.name,
		description: row.description,
		categoryId: row.category_id,
		categoryName: row.category_name,
		triggerType: row.trigger_type,
		triggerKm: row.trigger_km,
		triggerDays: row.trigger_days,
		leadTimeKm: row.lead_time_km,
		leadTimeDays: row.lead_time_days,
		lastDoneKm: row.last_done_km,
		lastDoneDate: row.last_done_date,
		nextDueKm: row.next_due_km,
		nextDueDate: row.next_due_date,
		status: row.status === 'overdue' ? 'Atrasado' : row.status,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	});
};

const planSelect = [
	'maintenance_plan.id',
	'maintenance_plan.vehicle_id',
	'maintenance_plan.organization_id',
	'maintenance_plan.name',
	'maintenance_plan.description',
	'maintenance_plan.category_id',
	'maintenance_category.name as category_name',
	'maintenance_plan.trigger_type',
	'maintenance_plan.trigger_km',
	'maintenance_plan.trigger_days',
	'maintenance_plan.lead_time_km',
	'maintenance_plan.lead_time_days',
	'maintenance_plan.last_done_km',
	'maintenance_plan.last_done_date',
	'maintenance_plan.next_due_km',
	'maintenance_plan.next_due_date',
	'maintenance_plan.status',
	'maintenance_plan.created_at',
	'maintenance_plan.updated_at'
] as const;

const getPlansSchema = v.object({
	organizationSlug: v.string(),
	vehicleId: v.optional(v.string())
});

export const getPlans = query(getPlansSchema, async ({ organizationSlug, vehicleId }) => {
	const { organizationId } = await getOrganizationContext(organizationSlug);

	let q = db
		.selectFrom('maintenance_plan')
		.leftJoin('maintenance_category', 'maintenance_category.id', 'maintenance_plan.category_id')
		.select(planSelect)
		.where('maintenance_plan.organization_id', '=', organizationId);

	if (vehicleId) {
		q = q.where('maintenance_plan.vehicle_id', '=', vehicleId);
	}

	const rows = await q.orderBy('maintenance_plan.name', 'asc').execute();
	return rows.map(toPlan);
});

const getPlanSchema = v.object({
	organizationSlug: v.string(),
	id: v.string()
});

export const getPlan = query(getPlanSchema, async ({ organizationSlug, id }) => {
	const { organizationId } = await getOrganizationContext(organizationSlug);

	const row = await db
		.selectFrom('maintenance_plan')
		.leftJoin('maintenance_category', 'maintenance_category.id', 'maintenance_plan.category_id')
		.select(planSelect)
		.where('maintenance_plan.id', '=', id)
		.where('maintenance_plan.organization_id', '=', organizationId)
		.executeTakeFirst();

	if (!row) {
		error(404, 'Maintenance plan not found');
	}

	return toPlan(row);
});

export const createPlan = form(createPlanFormSchema, async (data) => {
	const {
		organizationSlug,
		vehicleId,
		name,
		description,
		category,
		triggerType,
		triggerKm,
		triggerDays,
		leadTimeKm,
		leadTimeDays,
		lastDoneKm,
		lastDoneDate
	} = data;
	const { organizationId } = await getOrganizationContext(organizationSlug);

	const categoryId = category?.trim() ? await findOrCreateCategory(organizationId, category) : null;
	const vehicle = await getVehicleForOrganization(organizationId, vehicleId);

	const { nextDueKm, nextDueDate, status } = computePlanStatus({
		triggerType,
		triggerKm: triggerKm ?? null,
		triggerDays: triggerDays ?? null,
		leadTimeKm: leadTimeKm ?? null,
		leadTimeDays: leadTimeDays ?? null,
		lastDoneKm: lastDoneKm ?? null,
		lastDoneDate: lastDoneDate ?? null,
		currentKm: vehicle?.current_km ?? 0
	});

	const id = crypto.randomUUID();

	await db
		.insertInto('maintenance_plan')
		.values({
			id,
			vehicle_id: vehicleId,
			organization_id: organizationId,
			name,
			description: description || null,
			category_id: categoryId,
			trigger_type: triggerType,
			trigger_km: triggerKm ?? null,
			trigger_days: triggerDays ?? null,
			lead_time_km: leadTimeKm ?? null,
			lead_time_days: leadTimeDays ?? null,
			last_done_km: lastDoneKm ?? null,
			last_done_date: lastDoneDate ?? null,
			next_due_km: nextDueKm,
			next_due_date: nextDueDate,
			status,
			created_at: new Date(),
			updated_at: new Date()
		})
		.execute();

	await Promise.all([
		getPlans({ organizationSlug }).refresh(),
		getPlans({ organizationSlug, vehicleId }).refresh(),
		getCategories({ organizationSlug }).refresh()
	]);

	return { success: true, id };
});

export const updatePlan = form(updatePlanFormSchema, async (data) => {
	const {
		organizationSlug,
		id,
		name,
		description,
		category,
		triggerType,
		triggerKm,
		triggerDays,
		leadTimeKm,
		leadTimeDays,
		lastDoneKm,
		lastDoneDate
	} = data;
	const { organizationId } = await getOrganizationContext(organizationSlug);

	const existing = await db
		.selectFrom('maintenance_plan')
		.selectAll()
		.where('id', '=', id)
		.where('organization_id', '=', organizationId)
		.executeTakeFirst();

	if (!existing) {
		error(404, 'Maintenance plan not found');
	}

	const vehicle = await db
		.selectFrom('vehicle')
		.select('current_km')
		.where('id', '=', existing.vehicle_id)
		.where('organization_id', '=', organizationId)
		.executeTakeFirst();

	if (!vehicle) {
		error(409, 'Maintenance plan is linked to a vehicle outside this organization');
	}

	const merged = {
		triggerType: triggerType ?? existing.trigger_type,
		triggerKm: triggerKm !== undefined ? (triggerKm ?? null) : existing.trigger_km,
		triggerDays: triggerDays !== undefined ? (triggerDays ?? null) : existing.trigger_days,
		leadTimeKm: leadTimeKm !== undefined ? (leadTimeKm ?? null) : existing.lead_time_km,
		leadTimeDays: leadTimeDays !== undefined ? (leadTimeDays ?? null) : existing.lead_time_days,
		lastDoneKm: lastDoneKm !== undefined ? (lastDoneKm ?? null) : existing.last_done_km,
		lastDoneDate: lastDoneDate !== undefined ? (lastDoneDate ?? null) : existing.last_done_date,
		currentKm: vehicle?.current_km ?? 0
	};

	const { nextDueKm, nextDueDate, status } = computePlanStatus(
		merged as Parameters<typeof computePlanStatus>[0]
	);

	const updates: Record<string, unknown> = {
		next_due_km: nextDueKm,
		next_due_date: nextDueDate,
		status,
		updated_at: new Date()
	};
	if (name !== undefined) updates.name = name;
	if (description !== undefined) updates.description = description || null;
	if (category !== undefined) {
		updates.category_id = category?.trim()
			? await findOrCreateCategory(organizationId, category)
			: null;
	}
	if (triggerType !== undefined) updates.trigger_type = triggerType;
	if (triggerKm !== undefined) updates.trigger_km = triggerKm ?? null;
	if (triggerDays !== undefined) updates.trigger_days = triggerDays ?? null;
	if (leadTimeKm !== undefined) updates.lead_time_km = leadTimeKm ?? null;
	if (leadTimeDays !== undefined) updates.lead_time_days = leadTimeDays ?? null;
	if (lastDoneKm !== undefined) updates.last_done_km = lastDoneKm ?? null;
	if (lastDoneDate !== undefined) updates.last_done_date = lastDoneDate ?? null;

	await db
		.updateTable('maintenance_plan')
		.set(updates)
		.where('id', '=', id)
		.where('organization_id', '=', organizationId)
		.execute();

	await Promise.all([
		getPlans({ organizationSlug }).refresh(),
		getPlans({ organizationSlug, vehicleId: existing.vehicle_id }).refresh(),
		getPlan({ organizationSlug, id }).refresh(),
		getCategories({ organizationSlug }).refresh()
	]);

	return { success: true };
});

export const deletePlan = command(deletePlanSchema, async ({ organizationSlug, id }) => {
	const { organizationId } = await getOrganizationContext(organizationSlug);

	const deleted = await db
		.deleteFrom('maintenance_plan')
		.where('id', '=', id)
		.where('organization_id', '=', organizationId)
		.returningAll()
		.execute();

	if (deleted.length === 0) {
		error(404, 'Maintenance plan not found');
	}

	await Promise.all([
		getPlans({ organizationSlug }).refresh(),
		getPlans({ organizationSlug, vehicleId: deleted[0].vehicle_id }).refresh()
	]);

	return { success: true };
});
