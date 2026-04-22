import * as v from 'valibot';

const stringId = v.pipe(v.string(), v.minLength(1));

export const triggerTypes = ['km', 'days', 'both'] as const;
export const planStatuses = ['ok', 'upcoming', 'Atrasado'] as const;

export const MaintenancePlan = v.object({
	id: stringId,
	vehicleId: stringId,
	organizationId: stringId,
	name: v.pipe(v.string(), v.minLength(1, 'Plan name is required')),
	description: v.nullable(v.string()),
	categoryId: v.nullable(v.string()),
	categoryName: v.nullable(v.string()),
	triggerType: v.picklist(triggerTypes),
	triggerKm: v.nullable(v.number()),
	triggerDays: v.nullable(v.number()),
	leadTimeKm: v.nullable(v.number()),
	leadTimeDays: v.nullable(v.number()),
	lastDoneKm: v.nullable(v.number()),
	lastDoneDate: v.nullable(v.date()),
	nextDueKm: v.nullable(v.number()),
	nextDueDate: v.nullable(v.date()),
	status: v.picklist(planStatuses),
	createdAt: v.date(),
	updatedAt: v.date()
});

export type MaintenancePlan = v.InferOutput<typeof MaintenancePlan>;

export const createPlanFormSchema = v.object({
	organizationSlug: v.pipe(v.string(), v.minLength(1)),
	vehicleId: v.pipe(v.string(), v.minLength(1, 'Vehicle is required')),
	name: v.pipe(v.string(), v.minLength(1, 'Plan name is required')),
	description: v.optional(v.string()),
	category: v.optional(v.string()),
	triggerType: v.picklist(triggerTypes, 'Please select a valid trigger type'),
	triggerKm: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : undefined)),
			v.optional(v.pipe(v.number(), v.minValue(1)))
		)
	),
	triggerDays: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : undefined)),
			v.optional(v.pipe(v.number(), v.minValue(1)))
		)
	),
	leadTimeKm: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : undefined)),
			v.optional(v.number())
		)
	),
	leadTimeDays: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : undefined)),
			v.optional(v.number())
		)
	),
	lastDoneKm: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : undefined)),
			v.optional(v.number())
		)
	),
	lastDoneDate: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? new Date(val) : undefined)),
			v.optional(v.date())
		)
	)
});

export const updatePlanFormSchema = v.object({
	organizationSlug: v.pipe(v.string(), v.minLength(1)),
	id: v.pipe(v.string(), v.minLength(1)),
	name: v.optional(v.pipe(v.string(), v.minLength(1))),
	description: v.optional(v.string()),
	category: v.optional(v.string()),
	triggerType: v.optional(v.picklist(triggerTypes)),
	triggerKm: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : undefined)),
			v.optional(v.number())
		)
	),
	triggerDays: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : undefined)),
			v.optional(v.number())
		)
	),
	leadTimeKm: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : undefined)),
			v.optional(v.number())
		)
	),
	leadTimeDays: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : undefined)),
			v.optional(v.number())
		)
	),
	lastDoneKm: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : undefined)),
			v.optional(v.number())
		)
	),
	lastDoneDate: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? new Date(val) : undefined)),
			v.optional(v.date())
		)
	)
});

export const deletePlanSchema = v.object({
	organizationSlug: v.pipe(v.string(), v.minLength(1)),
	id: v.pipe(v.string(), v.minLength(1))
});
