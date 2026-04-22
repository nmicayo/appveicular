<script lang="ts">
	import { page } from '$app/state';
	import { getPlans, deletePlan } from '$lib/remote/maintenance-plan.remote';
	import { getVehicles } from '$lib/remote/vehicle.remote';
	import type { MaintenancePlan } from '$lib/schemas/maintenance-plan';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import CalendarIcon from '@tabler/icons-svelte/icons/calendar';
	import CreatePlanDialog from './components/create-plan-dialog.svelte';
	import EditPlanDialog from './components/edit-plan-dialog.svelte';

	const slug = page.params.organization_slug!;
	const plansQuery = $derived(getPlans({ organizationSlug: slug }));
	const vehiclesQuery = $derived(getVehicles({ organizationSlug: slug }));

	const vehicleMap = $derived(
		Object.fromEntries((vehiclesQuery.current ?? []).map((v) => [v.id, v]))
	);

	let showCreate = $state(false);
	let editingPlan = $state<MaintenancePlan | undefined>();
	let showEdit = $state(false);

	function handleEdit(plan: MaintenancePlan) {
		editingPlan = { ...plan };
		showEdit = true;
	}

	async function handleDelete(id: string) {
		if (!confirm('Tem certeza que deseja excluir este plano?')) return;
		try {
			await deletePlan({ organizationSlug: slug, id });
		} catch (err) {
			console.error('Failed to delete plan:', err);
		}
	}

	const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		ok: 'secondary',
		upcoming: 'default',
		Atrasado: 'destructive'
	};

	const statusLabel: Record<string, string> = {
		ok: 'Em dia',
		upcoming: 'Próximo',
		Atrasado: 'Atrasado'
	};
</script>

<div class="hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
	<div class="flex items-center justify-between gap-2">
		<div class="flex flex-col gap-1">
			<h2 class="text-2xl font-semibold tracking-tight">Planos de Manutenção</h2>
			<p class="text-muted-foreground">Manutenções programadas para sua frota.</p>
		</div>
		<Button onclick={() => (showCreate = true)} variant="default">
			<CirclePlusIcon class="mr-2 size-4" />
			Adicionar Plano
		</Button>
	</div>

	{#if plansQuery.loading}
		<div class="py-8 text-center">
			<p class="text-muted-foreground">Carregando planos...</p>
		</div>
	{:else if plansQuery.error}
		<div class="py-8 text-center">
			<p class="text-destructive">Falha ao carregar planos. Tente novamente.</p>
		</div>
	{:else if plansQuery.current && plansQuery.current.length > 0}
		<div class="rounded-xl border bg-card shadow-sm">
			<div class="divide-y">
				{#each plansQuery.current as plan (plan.id)}
					{@const vehicle = vehicleMap[plan.vehicleId]}
					<div class="flex items-center gap-4 px-5 py-4">
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<p class="font-semibold">{plan.name}</p>
								<Badge variant={statusVariant[plan.status] ?? 'outline'}>
									{statusLabel[plan.status] ?? plan.status}
								</Badge>
							</div>
							<p class="mt-0.5 text-sm text-muted-foreground">
								{vehicle?.name ?? 'Veículo desconhecido'}
								{#if vehicle?.plate}· {vehicle.plate}{/if}
							</p>
							{#if plan.description}
								<p class="mt-0.5 text-sm text-muted-foreground">{plan.description}</p>
							{/if}
						</div>
						<div class="flex flex-col items-end gap-1 text-sm text-muted-foreground">
							{#if plan.triggerKm}
								<span>A cada {plan.triggerKm.toLocaleString()} km</span>
							{/if}
							{#if plan.triggerDays}
								<span>A cada {plan.triggerDays} dias</span>
							{/if}
							{#if plan.nextDueKm}
								<span class="text-foreground font-medium">Vence em {plan.nextDueKm.toLocaleString()} km</span>
							{/if}
							{#if plan.nextDueDate}
								<span class="text-foreground font-medium">
									Vence em {new Date(plan.nextDueDate).toLocaleDateString('pt-BR')}
								</span>
							{/if}
						</div>
						<div class="flex gap-1">
							<Button
								variant="ghost"
								size="icon"
								class="size-8"
								onclick={() => handleEdit(plan)}
							>
								<PencilIcon class="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								class="size-8 text-destructive hover:text-destructive"
								onclick={() => handleDelete(plan.id)}
							>
								<Trash2Icon class="size-4" />
							</Button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card py-16">
			<CalendarIcon class="size-12 text-muted-foreground/50" />
			<div class="text-center">
				<p class="font-medium">Nenhum plano de manutenção ainda</p>
				<p class="text-sm text-muted-foreground">Crie um plano para acompanhar as manutenções programadas.</p>
			</div>
			<Button onclick={() => (showCreate = true)} variant="outline">
				<CirclePlusIcon class="mr-2 size-4" />
				Adicionar Plano
			</Button>
		</div>
	{/if}
</div>

<CreatePlanDialog bind:open={showCreate} />
<EditPlanDialog bind:open={showEdit} bind:plan={editingPlan} />
