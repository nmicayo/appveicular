import * as v from 'valibot';

const stringId = v.pipe(v.string(), v.minLength(1));

export const maintenanceTypes = ['preventive', 'corrective', 'emergency'] as const;

// Default category suggestions shown before the org has created any.
export const defaultMaintenanceCategories = [
	'Troca de Óleo',
	'Pneus',
	'Freios',
	'Filtros',
	'Bateria',
	'Suspensão',
	'Elétrica',
	'Arrefecimento',
	'Transmissão',
	'Funilaria',
	'Revisão',
	'Outros'
] as const;

export const MaintenanceRecord = v.object({
	id: stringId,
	vehicleId: stringId,
	organizationId: stringId,
	type: v.picklist(maintenanceTypes),
	date: v.date(),
	odometerKm: v.nullable(v.number()),
	workshop: v.nullable(v.string()),
	categoryId: v.nullable(v.string()),
	categoryName: v.nullable(v.string()),
	reportedProblem: v.nullable(v.string()),
	cost: v.nullable(v.number()),
	notes: v.nullable(v.string()),
	createdAt: v.date(),
	updatedAt: v.date()
});

export type MaintenanceRecord = v.InferOutput<typeof MaintenanceRecord>;

export const createRecordFormSchema = v.object({
	organizationSlug: v.pipe(v.string(), v.minLength(1)),
	vehicleId: v.pipe(v.string(), v.minLength(1, 'Vehicle is required')),
	type: v.picklist(maintenanceTypes, 'Please select a valid type'),
	date: v.pipe(
		v.string(),
		v.nonEmpty('Date is required'),
		v.transform((val) => new Date(val)),
		v.date()
	),
	odometerKm: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : undefined)),
			v.optional(v.number())
		)
	),
	workshop: v.optional(v.string()),
	category: v.optional(v.string()),
	reportedProblem: v.optional(v.string()),
	cost: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseFloat(val) : undefined)),
			v.optional(v.pipe(v.number(), v.minValue(0, 'Cost must be non-negative')))
		)
	),
	notes: v.optional(v.string())
});

export const updateRecordFormSchema = v.object({
	organizationSlug: v.pipe(v.string(), v.minLength(1)),
	id: v.pipe(v.string(), v.minLength(1)),
	vehicleId: v.optional(v.pipe(v.string(), v.minLength(1))),
	type: v.optional(v.picklist(maintenanceTypes)),
	date: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => new Date(val)),
			v.date()
		)
	),
	odometerKm: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : undefined)),
			v.optional(v.number())
		)
	),
	workshop: v.optional(v.string()),
	category: v.optional(v.string()),
	reportedProblem: v.optional(v.string()),
	cost: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseFloat(val) : undefined)),
			v.optional(v.pipe(v.number(), v.minValue(0)))
		)
	),
	notes: v.optional(v.string())
});

export const deleteRecordSchema = v.object({
	organizationSlug: v.pipe(v.string(), v.minLength(1)),
	id: v.pipe(v.string(), v.minLength(1))
});
