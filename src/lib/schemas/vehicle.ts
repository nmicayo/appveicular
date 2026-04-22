import * as v from 'valibot';

const stringId = v.pipe(v.string(), v.minLength(1));

export const Vehicle = v.object({
	id: stringId,
	organizationId: stringId,
	name: v.pipe(v.string(), v.minLength(1, 'Vehicle name is required')),
	nickname: v.nullable(v.string()),
	brand: v.nullable(v.string()),
	model: v.nullable(v.string()),
	year: v.nullable(v.number()),
	plate: v.nullable(v.string()),
	currentKm: v.number(),
	fuelType: v.nullable(v.string()),
	engine: v.nullable(v.string()),
	notes: v.nullable(v.string()),
	createdAt: v.date(),
	updatedAt: v.date()
});

export type Vehicle = v.InferOutput<typeof Vehicle>;

export const createVehicleFormSchema = v.object({
	organizationSlug: v.pipe(v.string(), v.minLength(1)),
	name: v.pipe(v.string(), v.minLength(1, 'Vehicle name is required')),
	nickname: v.optional(v.string()),
	brand: v.optional(v.string()),
	model: v.optional(v.string()),
	year: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : undefined)),
			v.optional(v.number())
		)
	),
	plate: v.optional(v.string()),
	currentKm: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : 0)),
			v.number()
		)
	),
	fuelType: v.optional(v.string()),
	engine: v.optional(v.string()),
	notes: v.optional(v.string())
});

export const updateVehicleFormSchema = v.object({
	organizationSlug: v.pipe(v.string(), v.minLength(1)),
	id: v.pipe(v.string(), v.minLength(1)),
	name: v.optional(v.pipe(v.string(), v.minLength(1, 'Vehicle name is required'))),
	nickname: v.optional(v.string()),
	brand: v.optional(v.string()),
	model: v.optional(v.string()),
	year: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : undefined)),
			v.optional(v.number())
		)
	),
	plate: v.optional(v.string()),
	currentKm: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => (val ? parseInt(val, 10) : 0)),
			v.number()
		)
	),
	fuelType: v.optional(v.string()),
	engine: v.optional(v.string()),
	notes: v.optional(v.string())
});

export const deleteVehicleSchema = v.object({
	organizationSlug: v.pipe(v.string(), v.minLength(1)),
	id: v.pipe(v.string(), v.minLength(1))
});
