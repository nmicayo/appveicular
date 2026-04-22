import { command, form, query } from '$app/server';
import { Vehicle, createVehicleFormSchema, updateVehicleFormSchema, deleteVehicleSchema } from '$lib/schemas/vehicle';
import { getOrganizationContext } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';

const toVehicle = (row: {
	id: string;
	organization_id: string;
	name: string;
	nickname: string | null;
	brand: string | null;
	model: string | null;
	year: number | null;
	plate: string | null;
	current_km: number;
	fuel_type: string | null;
	engine: string | null;
	notes: string | null;
	created_at: Date;
	updated_at: Date;
}): Vehicle => {
	return v.parse(Vehicle, {
		id: row.id,
		organizationId: row.organization_id,
		name: row.name,
		nickname: row.nickname,
		brand: row.brand,
		model: row.model,
		year: row.year,
		plate: row.plate,
		currentKm: row.current_km,
		fuelType: row.fuel_type,
		engine: row.engine,
		notes: row.notes,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	});
};

const getVehiclesSchema = v.object({
	organizationSlug: v.string()
});

export const getVehicles = query(getVehiclesSchema, async ({ organizationSlug }) => {
	const { organizationId } = await getOrganizationContext(organizationSlug);

	const rows = await db
		.selectFrom('vehicle')
		.selectAll()
		.where('organization_id', '=', organizationId)
		.orderBy('name', 'asc')
		.execute();

	return rows.map(toVehicle);
});

const getVehicleSchema = v.object({
	organizationSlug: v.string(),
	id: v.string()
});

export const getVehicle = query(getVehicleSchema, async ({ organizationSlug, id }) => {
	const { organizationId } = await getOrganizationContext(organizationSlug);

	const row = await db
		.selectFrom('vehicle')
		.selectAll()
		.where('id', '=', id)
		.where('organization_id', '=', organizationId)
		.executeTakeFirst();

	if (!row) {
		error(404, 'Vehicle not found');
	}

	return toVehicle(row);
});

export const createVehicle = form(createVehicleFormSchema, async (data) => {
	const { organizationSlug, name, nickname, brand, model, year, plate, currentKm, fuelType, engine, notes } = data;
	const { organizationId } = await getOrganizationContext(organizationSlug);

	const id = crypto.randomUUID();

	await db
		.insertInto('vehicle')
		.values({
			id,
			organization_id: organizationId,
			name,
			nickname: nickname || null,
			brand: brand || null,
			model: model || null,
			year: year ?? null,
			plate: plate || null,
			current_km: currentKm ?? 0,
			fuel_type: fuelType || null,
			engine: engine || null,
			notes: notes || null,
			created_at: new Date(),
			updated_at: new Date()
		})
		.execute();

	await getVehicles({ organizationSlug }).refresh();

	return { success: true, id };
});

export const updateVehicle = form(updateVehicleFormSchema, async (data) => {
	const { organizationSlug, id, name, nickname, brand, model, year, plate, currentKm, fuelType, engine, notes } = data;
	const { organizationId } = await getOrganizationContext(organizationSlug);

	const updates: Record<string, unknown> = { updated_at: new Date() };
	if (name !== undefined) updates.name = name;
	if (nickname !== undefined) updates.nickname = nickname || null;
	if (brand !== undefined) updates.brand = brand || null;
	if (model !== undefined) updates.model = model || null;
	if (year !== undefined) updates.year = year ?? null;
	if (plate !== undefined) updates.plate = plate || null;
	if (currentKm !== undefined) updates.current_km = currentKm;
	if (fuelType !== undefined) updates.fuel_type = fuelType || null;
	if (engine !== undefined) updates.engine = engine || null;
	if (notes !== undefined) updates.notes = notes || null;

	const result = await db
		.updateTable('vehicle')
		.set(updates)
		.where('id', '=', id)
		.where('organization_id', '=', organizationId)
		.returningAll()
		.execute();

	if (result.length === 0) {
		error(404, 'Vehicle not found');
	}

	await Promise.all([
		getVehicles({ organizationSlug }).refresh(),
		getVehicle({ organizationSlug, id }).refresh()
	]);

	return { success: true };
});

export const deleteVehicle = command(deleteVehicleSchema, async ({ organizationSlug, id }) => {
	const { organizationId } = await getOrganizationContext(organizationSlug);

	const deleted = await db
		.deleteFrom('vehicle')
		.where('id', '=', id)
		.where('organization_id', '=', organizationId)
		.returningAll()
		.execute();

	if (deleted.length === 0) {
		error(404, 'Vehicle not found');
	}

	await getVehicles({ organizationSlug }).refresh();

	return { success: true };
});
