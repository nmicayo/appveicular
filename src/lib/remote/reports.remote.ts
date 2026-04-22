import { query, getRequestEvent } from '$app/server';
import { getOrganizationContext } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { sql } from 'kysely';
import * as v from 'valibot';

const isoDateString = v.pipe(
	v.string(),
	v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
);

const filtersSchema = v.object({
	vehicleId: v.optional(v.string()),
	dateFrom: v.optional(isoDateString),
	dateTo: v.optional(isoDateString),
	categoryId: v.optional(v.string())
});

const recordsSchema = v.object({
	vehicleId: v.optional(v.string()),
	dateFrom: v.optional(isoDateString),
	dateTo: v.optional(isoDateString),
	categoryId: v.optional(v.string()),
	page: v.optional(v.string()),
	sort: v.optional(v.picklist(['date', 'cost'])),
	dir: v.optional(v.picklist(['asc', 'desc']))
});

const PAGE_SIZE = 25;

function parseDateRange(dateFrom?: string, dateTo?: string) {
	const from = dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`) : undefined;
	const toExclusive = dateTo ? new Date(`${dateTo}T00:00:00.000Z`) : undefined;

	if (from && Number.isNaN(from.getTime())) {
		error(400, 'Invalid dateFrom value');
	}

	if (toExclusive && Number.isNaN(toExclusive.getTime())) {
		error(400, 'Invalid dateTo value');
	}

	if (toExclusive) {
		toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
	}

	if (from && toExclusive && from >= toExclusive) {
		error(400, 'dateFrom must be less than or equal to dateTo');
	}

	return { from, toExclusive };
}

export const getReportFilters = query(async () => {
	const event = getRequestEvent();
	const organizationSlug = event.params?.organization_slug;
	if (!organizationSlug) error(400, 'Organization slug not found');

	const { organizationId } = await getOrganizationContext(organizationSlug);

	const [vehicles, categories] = await Promise.all([
		db
			.selectFrom('vehicle')
			.select(['id', 'name', 'plate'])
			.where('organization_id', '=', organizationId)
			.orderBy('name', 'asc')
			.execute(),
		db
			.selectFrom('maintenance_category')
			.select(['id', 'name'])
			.where('organization_id', '=', organizationId)
			.orderBy('name', 'asc')
			.execute()
	]);

	return { vehicles, categories };
});

export const getReportsData = query(
	filtersSchema,
	async ({ vehicleId, dateFrom, dateTo, categoryId }) => {
		const event = getRequestEvent();
		const organizationSlug = event.params?.organization_slug;
		if (!organizationSlug) error(400, 'Organization slug not found');

		const { organizationId } = await getOrganizationContext(organizationSlug);
		const { from, toExclusive } = parseDateRange(dateFrom, dateTo);

		const [
			costStats,
			typeDistribution,
			planStatusDistribution,
			monthlyCosts,
			topVehiclesByCost,
			vehiclesWithOverdue
		] = await Promise.all([
			db
				.selectFrom('maintenance_record')
				.select([
					db.fn.sum<string>('cost').as('totalCost'),
					db.fn.avg<string>('cost').as('avgCost'),
					db.fn.count<number>('id').as('totalRecords')
				])
				.where('organization_id', '=', organizationId)
				.$if(!!vehicleId, (q) => q.where('vehicle_id', '=', vehicleId!))
				.$if(!!from, (q) => q.where('date', '>=', from!))
				.$if(!!toExclusive, (q) => q.where('date', '<', toExclusive!))
				.$if(!!categoryId, (q) => q.where('category_id', '=', categoryId!))
				.execute(),

			db
				.selectFrom('maintenance_record')
				.select(['type', db.fn.count<number>('id').as('count')])
				.where('organization_id', '=', organizationId)
				.$if(!!vehicleId, (q) => q.where('vehicle_id', '=', vehicleId!))
				.$if(!!from, (q) => q.where('date', '>=', from!))
				.$if(!!toExclusive, (q) => q.where('date', '<', toExclusive!))
				.$if(!!categoryId, (q) => q.where('category_id', '=', categoryId!))
				.groupBy('type')
				.execute(),

			db
				.selectFrom('maintenance_plan')
				.select(['status', db.fn.count<number>('id').as('count')])
				.where('organization_id', '=', organizationId)
				.$if(!!vehicleId, (q) => q.where('vehicle_id', '=', vehicleId!))
				.groupBy('status')
				.execute(),

			db
				.selectFrom('maintenance_record')
				.select([
					sql<string>`TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM')`.as('month'),
					db.fn.sum<string>('cost').as('total')
				])
				.where('organization_id', '=', organizationId)
				.where('cost', 'is not', null)
				.where('date', '>=', sql<Date>`NOW() - INTERVAL '6 months'`)
				.$if(!!from, (q) => q.where('date', '>=', from!))
				.$if(!!toExclusive, (q) => q.where('date', '<', toExclusive!))
				.$if(!!vehicleId, (q) => q.where('vehicle_id', '=', vehicleId!))
				.$if(!!categoryId, (q) => q.where('category_id', '=', categoryId!))
				.groupBy(sql`DATE_TRUNC('month', date)`)
				.orderBy(sql`DATE_TRUNC('month', date)`, 'asc')
				.execute(),

			db
				.selectFrom('maintenance_record')
				.innerJoin('vehicle', (join) =>
					join
						.onRef('vehicle.id', '=', 'maintenance_record.vehicle_id')
						.onRef('vehicle.organization_id', '=', 'maintenance_record.organization_id')
				)
				.select([
					'vehicle.id as vehicleId',
					'vehicle.name as vehicleName',
					'vehicle.plate as vehiclePlate',
					db.fn.sum<string>('maintenance_record.cost').as('totalCost'),
					db.fn.count<number>('maintenance_record.id').as('recordCount')
				])
				.where('maintenance_record.organization_id', '=', organizationId)
				.where('maintenance_record.cost', 'is not', null)
				.$if(!!vehicleId, (q) => q.where('maintenance_record.vehicle_id', '=', vehicleId!))
				.$if(!!from, (q) => q.where('maintenance_record.date', '>=', from!))
				.$if(!!toExclusive, (q) => q.where('maintenance_record.date', '<', toExclusive!))
				.$if(!!categoryId, (q) => q.where('maintenance_record.category_id', '=', categoryId!))
				.groupBy(['vehicle.id', 'vehicle.name', 'vehicle.plate'])
				.orderBy(sql`SUM(maintenance_record.cost)`, 'desc')
				.limit(5)
				.execute(),

			db
				.selectFrom('vehicle')
				.innerJoin('maintenance_plan', 'maintenance_plan.vehicle_id', 'vehicle.id')
				.select(sql<number>`COUNT(DISTINCT vehicle.id)`.as('count'))
				.where('vehicle.organization_id', '=', organizationId)
				.where('maintenance_plan.status', '=', 'Atrasado')
				.$if(!!vehicleId, (q) => q.where('vehicle.id', '=', vehicleId!))
				.execute()
		]);

		const statusMap: Record<string, number> = {};
		for (const row of planStatusDistribution) {
			statusMap[row.status] = Number(row.count) || 0;
		}

		const typeMap: Record<string, number> = {};
		for (const row of typeDistribution) {
			typeMap[row.type] = Number(row.count) || 0;
		}

		const totalPlans =
			(statusMap['ok'] ?? 0) + (statusMap['upcoming'] ?? 0) + (statusMap['Atrasado'] ?? 0);
		const fleetHealth =
			totalPlans > 0 ? Math.round(((statusMap['ok'] ?? 0) / totalPlans) * 100) : 100;

		return {
			fleetHealth,
			totalCost: parseFloat(costStats[0]?.totalCost ?? '0') || 0,
			avgCost: parseFloat(costStats[0]?.avgCost ?? '0') || 0,
			totalRecords: Number(costStats[0]?.totalRecords) || 0,
			vehiclesWithOverdue: Number(vehiclesWithOverdue[0]?.count) || 0,
			typeDistribution: {
				preventive: typeMap['preventive'] ?? 0,
				corrective: typeMap['corrective'] ?? 0,
				emergency: typeMap['emergency'] ?? 0
			},
			planStatus: {
				ok: statusMap['ok'] ?? 0,
				upcoming: statusMap['upcoming'] ?? 0,
				overdue: statusMap['Atrasado'] ?? 0,
				total: totalPlans
			},
			monthlyCosts: monthlyCosts.map((r) => ({
				month: r.month,
				total: parseFloat(r.total ?? '0') || 0
			})),
			topVehicles: topVehiclesByCost.map((v) => ({
				vehicleId: v.vehicleId,
				vehicleName: v.vehicleName,
				vehiclePlate: v.vehiclePlate,
				totalCost: parseFloat(v.totalCost ?? '0') || 0,
				recordCount: Number(v.recordCount) || 0
			}))
		};
	}
);

export const getFilteredRecords = query(
	recordsSchema,
	async ({ vehicleId, dateFrom, dateTo, categoryId, page, sort, dir }) => {
		const event = getRequestEvent();
		const organizationSlug = event.params?.organization_slug;
		if (!organizationSlug) error(400, 'Organization slug not found');

		const { organizationId } = await getOrganizationContext(organizationSlug);
		const pageNum = Math.max(0, parseInt(page ?? '0', 10) || 0);
		const sortCol = sort ?? 'date';
		const sortDir = dir ?? 'desc';
		const { from, toExclusive } = parseDateRange(dateFrom, dateTo);

		const base = () =>
			db
				.selectFrom('maintenance_record')
				.where('maintenance_record.organization_id', '=', organizationId)
				.$if(!!vehicleId, (q) => q.where('maintenance_record.vehicle_id', '=', vehicleId!))
				.$if(!!from, (q) => q.where('maintenance_record.date', '>=', from!))
				.$if(!!toExclusive, (q) => q.where('maintenance_record.date', '<', toExclusive!))
				.$if(!!categoryId, (q) => q.where('maintenance_record.category_id', '=', categoryId!));

		const [rows, countResult] = await Promise.all([
			base()
				.innerJoin('vehicle', (join) =>
					join
						.onRef('vehicle.id', '=', 'maintenance_record.vehicle_id')
						.onRef('vehicle.organization_id', '=', 'maintenance_record.organization_id')
				)
				.leftJoin(
					'maintenance_category',
					'maintenance_category.id',
					'maintenance_record.category_id'
				)
				.select([
					'maintenance_record.id',
					'maintenance_record.date',
					'maintenance_record.type',
					'maintenance_record.cost',
					'maintenance_record.workshop',
					'maintenance_record.odometer_km',
					'vehicle.name as vehicleName',
					'vehicle.plate as vehiclePlate',
					'maintenance_category.name as categoryName'
				])
				.orderBy(
					sortCol === 'cost' ? 'maintenance_record.cost' : 'maintenance_record.date',
					sortDir
				)
				.limit(PAGE_SIZE)
				.offset(pageNum * PAGE_SIZE)
				.execute(),

			base()
				.select([
					db.fn.count<number>('maintenance_record.id').as('total'),
					db.fn.sum<string>('maintenance_record.cost').as('totalCost')
				])
				.execute()
		]);

		const total = Number(countResult[0]?.total) || 0;
		const totalCost = parseFloat(countResult[0]?.totalCost ?? '0') || 0;

		return {
			records: rows.map((r) => ({
				id: r.id,
				date: r.date,
				type: r.type,
				cost: r.cost !== null ? parseFloat(r.cost) : null,
				workshop: r.workshop,
				odometerKm: r.odometer_km,
				vehicleName: r.vehicleName,
				vehiclePlate: r.vehiclePlate,
				categoryName: r.categoryName ?? null
			})),
			total,
			totalCost,
			page: pageNum,
			pageSize: PAGE_SIZE,
			pageCount: Math.ceil(total / PAGE_SIZE)
		};
	}
);

export const getVehicleReports = query(
	filtersSchema,
	async ({ vehicleId, dateFrom, dateTo, categoryId }) => {
		const event = getRequestEvent();
		const organizationSlug = event.params?.organization_slug;
		if (!organizationSlug) error(400, 'Organization slug not found');

		const { organizationId } = await getOrganizationContext(organizationSlug);
		const { from, toExclusive } = parseDateRange(dateFrom, dateTo);

		const [vehicles, recordStats, planStats] = await Promise.all([
			db
				.selectFrom('vehicle')
				.select(['id', 'name', 'nickname', 'plate', 'brand', 'model', 'current_km'])
				.where('organization_id', '=', organizationId)
				.$if(!!vehicleId, (q) => q.where('id', '=', vehicleId!))
				.orderBy('name', 'asc')
				.execute(),

			db
				.selectFrom('maintenance_record')
				.select([
					'vehicle_id',
					db.fn.count<number>('id').as('recordCount'),
					db.fn.sum<string>('cost').as('totalCost'),
					db.fn.max<Date>('date').as('lastMaintenance'),
					sql<number>`COUNT(CASE WHEN type = 'preventive' THEN 1 END)`.as('preventiveCount'),
					sql<number>`COUNT(CASE WHEN type = 'corrective' THEN 1 END)`.as('correctiveCount'),
					sql<number>`COUNT(CASE WHEN type = 'emergency' THEN 1 END)`.as('emergencyCount')
				])
				.where('organization_id', '=', organizationId)
				.$if(!!vehicleId, (q) => q.where('vehicle_id', '=', vehicleId!))
				.$if(!!from, (q) => q.where('date', '>=', from!))
				.$if(!!toExclusive, (q) => q.where('date', '<', toExclusive!))
				.$if(!!categoryId, (q) => q.where('category_id', '=', categoryId!))
				.groupBy('vehicle_id')
				.execute(),

			db
				.selectFrom('maintenance_plan')
				.select([
					'vehicle_id',
					db.fn.count<number>('id').as('totalPlans'),
					sql<number>`COUNT(CASE WHEN status = 'ok' THEN 1 END)`.as('okPlans'),
					sql<number>`COUNT(CASE WHEN status = 'upcoming' THEN 1 END)`.as('upcomingPlans'),
					sql<number>`COUNT(CASE WHEN status = 'Atrasado' THEN 1 END)`.as('overduePlans')
				])
				.where('organization_id', '=', organizationId)
				.$if(!!vehicleId, (q) => q.where('vehicle_id', '=', vehicleId!))
				.groupBy('vehicle_id')
				.execute()
		]);

		const recordMap = new Map(recordStats.map((r) => [r.vehicle_id, r]));
		const planMap = new Map(planStats.map((p) => [p.vehicle_id, p]));

		return vehicles
			.map((v) => {
				const rec = recordMap.get(v.id);
				const pln = planMap.get(v.id);
				return {
					id: v.id,
					name: v.name,
					nickname: v.nickname,
					plate: v.plate,
					brand: v.brand,
					model: v.model,
					currentKm: v.current_km,
					totalCost: parseFloat(rec?.totalCost ?? '0') || 0,
					recordCount: Number(rec?.recordCount) || 0,
					lastMaintenance: rec?.lastMaintenance ?? null,
					preventiveCount: Number(rec?.preventiveCount) || 0,
					correctiveCount: Number(rec?.correctiveCount) || 0,
					emergencyCount: Number(rec?.emergencyCount) || 0,
					totalPlans: Number(pln?.totalPlans) || 0,
					okPlans: Number(pln?.okPlans) || 0,
					upcomingPlans: Number(pln?.upcomingPlans) || 0,
					overduePlans: Number(pln?.overduePlans) || 0
				};
			})
			.sort((a, b) => b.totalCost - a.totalCost);
	}
);
