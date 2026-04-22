import type { planStatuses, triggerTypes } from '$lib/schemas/maintenance-plan';

type TriggerType = (typeof triggerTypes)[number];
type PlanStatus = (typeof planStatuses)[number];

interface PlanInput {
	triggerType: TriggerType;
	triggerKm: number | null | undefined;
	triggerDays: number | null | undefined;
	leadTimeKm: number | null | undefined;
	leadTimeDays: number | null | undefined;
	lastDoneKm: number | null | undefined;
	lastDoneDate: Date | null | undefined;
	currentKm?: number;
}

interface PlanResult {
	nextDueKm: number | null;
	nextDueDate: Date | null;
	status: PlanStatus;
}

export function computePlanStatus(plan: PlanInput): PlanResult {
	const now = new Date();
	let nextDueKm: number | null = null;
	let nextDueDate: Date | null = null;

	if ((plan.triggerType === 'km' || plan.triggerType === 'both') && plan.triggerKm) {
		const base = plan.lastDoneKm ?? 0;
		nextDueKm = base + plan.triggerKm;
	}

	if ((plan.triggerType === 'days' || plan.triggerType === 'both') && plan.triggerDays) {
		const base = plan.lastDoneDate ?? now;
		const next = new Date(base);
		next.setDate(next.getDate() + plan.triggerDays);
		nextDueDate = next;
	}

	const currentKm = plan.currentKm ?? 0;

	let status: PlanStatus = 'ok';

	// Check Atrasado
	if (nextDueDate && nextDueDate < now) {
		status = 'Atrasado';
	} else if (nextDueKm !== null && currentKm >= nextDueKm) {
		status = 'Atrasado';
	}

	// Check upcoming (within lead time)
	if (status === 'ok') {
		if (nextDueDate && plan.leadTimeDays) {
			const leadDate = new Date(nextDueDate);
			leadDate.setDate(leadDate.getDate() - plan.leadTimeDays);
			if (now >= leadDate) {
				status = 'upcoming';
			}
		}
		if (nextDueKm !== null && plan.leadTimeKm && currentKm >= nextDueKm - plan.leadTimeKm) {
			status = 'upcoming';
		}
	}

	return { nextDueKm, nextDueDate, status };
}
