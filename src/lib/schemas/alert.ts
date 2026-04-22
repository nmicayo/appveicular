import * as v from 'valibot';

const stringId = v.pipe(v.string(), v.minLength(1));

export const alertTypes = ['upcoming', 'Atrasado'] as const;

export const Alert = v.object({
	id: stringId,
	vehicleId: stringId,
	planId: v.nullable(v.string()),
	organizationId: stringId,
	type: v.picklist(alertTypes),
	triggeredAt: v.date(),
	sentAt: v.nullable(v.date()),
	acknowledgedAt: v.nullable(v.date()),
	createdAt: v.date()
});

export type Alert = v.InferOutput<typeof Alert>;

export const acknowledgeAlertSchema = v.object({
	organizationSlug: v.pipe(v.string(), v.minLength(1)),
	id: v.pipe(v.string(), v.minLength(1))
});
