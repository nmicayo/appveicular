import { query, getRequestEvent } from '$app/server';
import { getOrganizationContext } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { sql } from 'kysely';

export const getDashboardStats = query(async () => {
	const event = getRequestEvent();
	const organizationSlug = event.params?.organization_slug;
	if (!organizationSlug) {
		error(400, 'Organization slug not found');
	}

	const { organizationId } = await getOrganizationContext(organizationSlug);

	const [
		totalVehicles,
		totalPlans,
		AtrasadoAlerts,
		upcomingAlerts,
		recentRecords,
		plansByStatus,
		costStats
	] = await Promise.all([
		db
			.selectFrom('vehicle')
			.select(db.fn.count<number>('id').as('count'))
			.where('organization_id', '=', organizationId)
			.execute(),
		db
			.selectFrom('maintenance_plan')
			.select(db.fn.count<number>('id').as('count'))
			.where('organization_id', '=', organizationId)
			.execute(),
		db
			.selectFrom('alert')
			.select(db.fn.count<number>('id').as('count'))
			.where('organization_id', '=', organizationId)
			.where('type', '=', 'Atrasado')
			.where('acknowledged_at', 'is', null)
			.execute(),
		db
			.selectFrom('alert')
			.select(db.fn.count<number>('id').as('count'))
			.where('organization_id', '=', organizationId)
			.where('type', '=', 'upcoming')
			.where('acknowledged_at', 'is', null)
			.execute(),
		db
			.selectFrom('maintenance_record')
			.leftJoin('maintenance_category', 'maintenance_category.id', 'maintenance_record.category_id')
			.select([
				'maintenance_record.id',
				'maintenance_record.vehicle_id',
				'maintenance_record.type',
				'maintenance_record.date',
				'maintenance_record.cost',
				'maintenance_record.workshop',
				'maintenance_category.name as category'
			])
			.where('maintenance_record.organization_id', '=', organizationId)
			.orderBy('maintenance_record.date', 'desc')
			.limit(5)
			.execute(),
		db
			.selectFrom('maintenance_plan')
			.select(['status', db.fn.count<number>('id').as('count')])
			.where('organization_id', '=', organizationId)
			.groupBy('status')
			.execute(),

		db
			.selectFrom('maintenance_record')
			.select([
				db.fn.sum<string>('cost').as('totalCost'),
				sql<string>`SUM(CASE WHEN date >= DATE_TRUNC('month', NOW()) THEN cost ELSE 0 END)`.as(
					'monthCost'
				)
			])
			.where('organization_id', '=', organizationId)
			.execute()
	]);

	const statusMap: Record<string, number> = {};
	for (const row of plansByStatus) {
		statusMap[row.status] = Number(row.count) || 0;
	}

	return {
		totalVehicles: Number(totalVehicles[0]?.count) || 0,
		totalPlans: Number(totalPlans[0]?.count) || 0,
		AtrasadoAlerts: Number(AtrasadoAlerts[0]?.count) || 0,
		upcomingAlerts: Number(upcomingAlerts[0]?.count) || 0,
		plansByStatus: {
			ok: statusMap['ok'] ?? 0,
			upcoming: statusMap['upcoming'] ?? 0,
			Atrasado: statusMap['Atrasado'] ?? 0
		},
		totalCost: parseFloat(costStats[0]?.totalCost ?? '0') || 0,
		monthCost: parseFloat(costStats[0]?.monthCost ?? '0') || 0,
		recentRecords: recentRecords.map((r) => ({
			id: r.id,
			vehicleId: r.vehicle_id,
			type: r.type,
			date: r.date,
			category: r.category,
			cost: r.cost !== null ? parseFloat(r.cost) : null,
			workshop: r.workshop
		}))
	};
});

export const getUpcomingMaintenance = query(async () => {
	const event = getRequestEvent();
	const organizationSlug = event.params?.organization_slug;
	if (!organizationSlug) {
		error(400, 'Organization slug not found');
	}

	const { organizationId } = await getOrganizationContext(organizationSlug);

	const plans = await db
		.selectFrom('maintenance_plan')
		.innerJoin('vehicle', (join) =>
			join
				.onRef('vehicle.id', '=', 'maintenance_plan.vehicle_id')
				.onRef('vehicle.organization_id', '=', 'maintenance_plan.organization_id')
		)
		.select([
			'maintenance_plan.id',
			'maintenance_plan.name',
			'maintenance_plan.status',
			'maintenance_plan.next_due_date',
			'maintenance_plan.next_due_km',
			'maintenance_plan.trigger_type',
			'vehicle.id as vehicle_id',
			'vehicle.name as vehicle_name',
			'vehicle.plate as vehicle_plate',
			'vehicle.current_km as vehicle_current_km'
		])
		.where('maintenance_plan.organization_id', '=', organizationId)
		.where('maintenance_plan.status', 'in', ['upcoming', 'Atrasado'])
		.orderBy('maintenance_plan.status', 'desc')
		.orderBy('maintenance_plan.next_due_date', 'asc')
		.limit(10)
		.execute();

	return plans.map((p) => ({
		id: p.id,
		name: p.name,
		status: p.status,
		nextDueDate: p.next_due_date,
		nextDueKm: p.next_due_km,
		triggerType: p.trigger_type,
		vehicleId: p.vehicle_id,
		vehicleName: p.vehicle_name,
		vehiclePlate: p.vehicle_plate,
		vehicleCurrentKm: p.vehicle_current_km
	}));
});
