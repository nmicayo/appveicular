<script lang="ts">
	import { page } from '$app/state';
	import { getDashboardStats, getUpcomingMaintenance } from '$lib/remote/dashboard.remote';
	import CarIcon from '@tabler/icons-svelte/icons/car';
	import CalendarIcon from '@tabler/icons-svelte/icons/calendar';
	import AlertTriangleIcon from '@tabler/icons-svelte/icons/alert-triangle';
	import ClockIcon from '@tabler/icons-svelte/icons/clock';
	import CoinIcon from '@tabler/icons-svelte/icons/coin';
	import ReportMoneyIcon from '@tabler/icons-svelte/icons/report-money';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	const slug = page.params.organization_slug!;
	const statsQuery = $derived(getDashboardStats());
	const upcomingQuery = $derived(getUpcomingMaintenance());
	const stats = $derived(statsQuery.current);
	const upcoming = $derived(upcomingQuery.current ?? []);

	const brl = (v: number) =>
		new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

	const brlCompact = (v: number) => {
		if (v >= 1_000_000) return `R$\u00a0${(v / 1_000_000).toFixed(1)}M`;
		if (v >= 1_000) return `R$\u00a0${(v / 1_000).toFixed(1)}K`;
		return brl(v);
	};

	const typeLabel: Record<string, string> = {
		preventive: 'Preventiva',
		corrective: 'Corretiva',
		emergency: 'Emergência'
	};
</script>

<div class="hidden h-full flex-1 flex-col gap-6 p-8 md:flex">
	<!-- Header -->
	<div class="flex items-center justify-between gap-3">
		<div class="flex flex-col gap-1">
			<h2 class="text-2xl font-semibold tracking-tight">Painel</h2>
			<p class="text-muted-foreground">Visão geral da frota e status de manutenção.</p>
		</div>
		<Button variant="default" href={'/' + slug + '/vehicles'}>
			<CarIcon class="mr-2 size-4" />
			Adicionar Veículo
		</Button>
	</div>

	<!-- KPI cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
		<!-- Veículos -->
		<div class="rounded-xl border bg-card p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Veículos</p>
				<CarIcon class="size-4 text-muted-foreground" />
			</div>
			<p class="mt-2 font-mono text-3xl font-black tabular-nums">{stats?.totalVehicles ?? '—'}</p>
			<p class="mt-1 text-xs text-muted-foreground">na frota</p>
		</div>

		<!-- Planos -->
		<div class="rounded-xl border bg-card p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Planos</p>
				<CalendarIcon class="size-4 text-muted-foreground" />
			</div>
			<p class="mt-2 font-mono text-3xl font-black tabular-nums">{stats?.totalPlans ?? '—'}</p>
			{#if stats}
				<p class="mt-1 text-xs text-muted-foreground">
					<span class="text-emerald-500">{stats.plansByStatus.ok} ok</span>
					· <span class="text-amber-500">{stats.plansByStatus.upcoming} próx.</span>
					· <span class="text-red-500">{stats.plansByStatus.Atrasado} atras.</span>
				</p>
			{/if}
		</div>

		<!-- Alertas atrasados -->
		<div
			class="rounded-xl border bg-card p-5 shadow-sm"
			class:border-red-500={!!stats && stats.AtrasadoAlerts > 0}
		>
			<div class="flex items-center justify-between">
				<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
					Atrasados
				</p>
				<AlertTriangleIcon class="size-4 {stats?.AtrasadoAlerts ? 'text-red-500' : 'text-muted-foreground'}" />
			</div>
			<p
				class="mt-2 font-mono text-3xl font-black tabular-nums"
				class:text-red-500={!!stats && stats.AtrasadoAlerts > 0}
			>
				{stats?.AtrasadoAlerts ?? '—'}
			</p>
			<p class="mt-1 text-xs text-muted-foreground">alertas em aberto</p>
		</div>

		<!-- Alertas próximos -->
		<div class="rounded-xl border bg-card p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Próximos</p>
				<ClockIcon class="size-4 {stats?.upcomingAlerts ? 'text-amber-500' : 'text-muted-foreground'}" />
			</div>
			<p
				class="mt-2 font-mono text-3xl font-black tabular-nums"
				class:text-amber-500={!!stats && stats.upcomingAlerts > 0}
			>
				{stats?.upcomingAlerts ?? '—'}
			</p>
			<p class="mt-1 text-xs text-muted-foreground">alertas próximos</p>
		</div>

		<!-- Gasto total -->
		<div class="rounded-xl border bg-card p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
					Gasto Total
				</p>
				<CoinIcon class="size-4 text-muted-foreground" />
			</div>
			<p class="mt-2 font-mono text-2xl font-black tabular-nums tracking-tight">
				{stats ? brlCompact(stats.totalCost) : '—'}
			</p>
			<p class="mt-1 text-xs text-muted-foreground">em manutenções</p>
		</div>

		<!-- Gasto este mês -->
		<div class="rounded-xl border bg-card p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
					Este Mês
				</p>
				<ReportMoneyIcon class="size-4 text-muted-foreground" />
			</div>
			<p class="mt-2 font-mono text-2xl font-black tabular-nums tracking-tight">
				{stats ? brlCompact(stats.monthCost) : '—'}
			</p>
			<p class="mt-1 text-xs text-muted-foreground">
				{new Date().toLocaleDateString('pt-BR', { month: 'long' })}
			</p>
		</div>
	</div>

	<!-- Manutenções próximas e atrasadas -->
	{#if upcoming.length > 0}
		<div class="rounded-xl border bg-card shadow-sm">
			<div class="flex items-center justify-between border-b px-5 py-3.5">
				<h3 class="font-semibold">Manutenções Próximas e Atrasadas</h3>
				<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
					{upcoming.length}
				</span>
			</div>
			<div class="divide-y">
				{#each upcoming as plan (plan.id)}
					<div class="flex items-center justify-between px-5 py-3">
						<div class="flex flex-col gap-0.5">
							<p class="font-medium">{plan.name}</p>
							<p class="text-sm text-muted-foreground">
								{plan.vehicleName}{plan.vehiclePlate ? ` · ${plan.vehiclePlate}` : ''}
							</p>
						</div>
						<div class="flex items-center gap-3">
							{#if plan.nextDueDate}
								<span class="text-sm text-muted-foreground">
									{new Date(plan.nextDueDate).toLocaleDateString('pt-BR')}
								</span>
							{/if}
							{#if plan.nextDueKm}
								<span class="text-sm text-muted-foreground"
									>{plan.nextDueKm.toLocaleString('pt-BR')} km</span
								>
							{/if}
							<Badge variant={plan.status === 'Atrasado' ? 'destructive' : 'secondary'}>
								{plan.status === 'Atrasado' ? 'atrasado' : 'próximo'}
							</Badge>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Registros recentes -->
	{#if stats && stats.recentRecords.length > 0}
		<div class="rounded-xl border bg-card shadow-sm">
			<div class="flex items-center justify-between border-b px-5 py-3.5">
				<h3 class="font-semibold">Registros Recentes de Manutenção</h3>
				<a href={'/' + slug + '/records'} class="text-xs text-muted-foreground hover:underline">
					Ver todos
				</a>
			</div>
			<div class="divide-y">
				{#each stats.recentRecords as record (record.id)}
					<div class="flex items-center justify-between px-5 py-3">
						<div class="flex flex-col gap-0.5">
							<p class="font-medium">
								{typeLabel[record.type] ?? record.type}
							</p>
							{#if record.category}
								<p class="text-sm text-muted-foreground">{record.category}</p>
							{/if}
						</div>
						<div class="flex items-center gap-3">
							<span class="text-sm text-muted-foreground">
								{new Date(record.date).toLocaleDateString('pt-BR')}
							</span>
							{#if record.cost !== null}
								<span class="font-mono text-sm font-semibold tabular-nums">
									{brl(record.cost)}
								</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
