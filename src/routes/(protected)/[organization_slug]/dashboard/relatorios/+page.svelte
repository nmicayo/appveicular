<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		getReportsData,
		getVehicleReports,
		getReportFilters,
		getFilteredRecords
	} from '$lib/remote/reports.remote';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import XIcon from '@lucide/svelte/icons/x';

	// ─── URL param helpers ───────────────────────────────────────────────────
	const p = $derived(page.url.searchParams);
	const activeVehicleId  = $derived(p.get('vehicleId')  ?? undefined);
	const activeFrom       = $derived(p.get('from')       ?? undefined);
	const activeTo         = $derived(p.get('to')         ?? undefined);
	const activeCategoryId = $derived(p.get('categoryId') ?? undefined);
	const activePage       = $derived(p.get('pg')         ?? '0');
	const activeSort       = $derived((p.get('sort') ?? 'date') as 'date' | 'cost');
	const activeDir        = $derived((p.get('dir')  ?? 'desc') as 'asc' | 'desc');
	const hasFilters = $derived(!!(activeVehicleId || activeFrom || activeTo || activeCategoryId));

	function nav(patch: Record<string, string | undefined>) {
		const url = new URL(page.url);
		for (const [k, v] of Object.entries(patch)) {
			if (v !== undefined && v !== '') url.searchParams.set(k, v);
			else url.searchParams.delete(k);
		}
		goto(url.toString(), { replaceState: true, keepFocus: true, noScroll: true });
	}

	function setFilter(key: string, value: string) {
		nav({ [key]: value || undefined, pg: '0' });
	}

	function clearFilters() {
		nav({ vehicleId: undefined, from: undefined, to: undefined, categoryId: undefined, pg: '0' });
	}

	function filterByVehicle(vehicleId: string) {
		nav({ vehicleId: activeVehicleId === vehicleId ? undefined : vehicleId, pg: '0' });
	}

	function toggleSort(col: 'date' | 'cost') {
		if (activeSort === col) {
			nav({ sort: col, dir: activeDir === 'asc' ? 'desc' : 'asc', pg: '0' });
		} else {
			nav({ sort: col, dir: 'desc', pg: '0' });
		}
	}

	function goPage(n: number) {
		nav({ pg: String(n) });
	}

	// ─── Remote queries (all reactive via $derived args) ─────────────────────
	const filtersQuery  = $derived(getReportFilters());
	const filterOptions = $derived(filtersQuery.current);

	const filterArgs = $derived({
		vehicleId: activeVehicleId,
		dateFrom: activeFrom,
		dateTo: activeTo,
		categoryId: activeCategoryId
	});

	const dataQuery    = $derived(getReportsData(filterArgs));
	const data         = $derived(dataQuery.current);
	const vehicleQuery = $derived(getVehicleReports(filterArgs));
	const vehicles     = $derived(vehicleQuery.current ?? []);
	const recordsQuery = $derived(getFilteredRecords({
		...filterArgs,
		page: activePage,
		sort: activeSort,
		dir: activeDir
	}));
	const records      = $derived(recordsQuery.current);
	const loading    = $derived(recordsQuery.loading);

	// ─── Gauge ───────────────────────────────────────────────────────────────
	const GAUGE_R   = 72;
	const GAUGE_C   = 2 * Math.PI * GAUGE_R;
	const GAUGE_ARC = GAUGE_C * 0.75;
	const GAUGE_GAP = GAUGE_C - GAUGE_ARC;

	function gaugeDash(pct: number) {
		const fill = GAUGE_ARC * (Math.min(100, Math.max(0, pct)) / 100);
		return `${fill} ${GAUGE_C - fill}`;
	}
	function gaugeColor(pct: number) {
		return pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
	}

	// ─── Donut ───────────────────────────────────────────────────────────────
	const DONUT_R = 58;
	const DONUT_C = 2 * Math.PI * DONUT_R;

	function donutSegments(segs: Array<{ value: number; color: string }>) {
		const total = segs.reduce((s, d) => s + d.value, 0) || 1;
		let offset = 0;
		return segs.map((d) => {
			const len = (d.value / total) * DONUT_C;
			const r = { ...d, dashArray: `${len} ${DONUT_C - len}`, dashOffset: -offset };
			offset += len;
			return r;
		});
	}

	// ─── Monthly bar chart ────────────────────────────────────────────────────
	const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
	function getLast6Months() {
		const now = new Date();
		return Array.from({ length: 6 }, (_, i) => {
			const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
			return { key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: MONTHS[d.getMonth()] };
		});
	}
	const last6Months = getLast6Months();
	const chartData   = $derived(last6Months.map((m) => ({
		label: m.label,
		value: data?.monthlyCosts.find((r) => r.month === m.key)?.total ?? 0
	})));
	const maxBarValue = $derived(Math.max(...chartData.map((d) => d.value), 1));

	// ─── Derived chart segments ───────────────────────────────────────────────
	const typeSegments   = $derived(data ? donutSegments([
		{ value: data.typeDistribution.preventive, color: '#3b82f6' },
		{ value: data.typeDistribution.corrective,  color: '#f59e0b' },
		{ value: data.typeDistribution.emergency,   color: '#ef4444' }
	]) : []);
	const statusSegments = $derived(data ? donutSegments([
		{ value: data.planStatus.ok,      color: '#22c55e' },
		{ value: data.planStatus.upcoming, color: '#f59e0b' },
		{ value: data.planStatus.overdue,  color: '#ef4444' }
	]) : []);
	const topMax = $derived(data ? Math.max(...data.topVehicles.map((v) => v.totalCost), 1) : 1);

	// ─── Formatters ───────────────────────────────────────────────────────────
	const brl = (v: number) =>
		new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
	const brlC = (v: number) => {
		if (v >= 1_000_000) return `R$\u00a0${(v/1_000_000).toFixed(1)}M`;
		if (v >= 1_000)     return `R$\u00a0${(v/1_000).toFixed(1)}K`;
		return brl(v);
	};

	const typeLabel: Record<string, string> = {
		preventive: 'Preventiva', corrective: 'Corretiva', emergency: 'Emergência'
	};
	const typeColor: Record<string, string> = {
		preventive: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
		corrective: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
		emergency:  'bg-red-500/10 text-red-600 dark:text-red-400'
	};

	function planHealthColor(ok: number, total: number) {
		if (!total) return '#6b7280';
		const p = ok / total;
		return p >= 0.7 ? '#22c55e' : p >= 0.4 ? '#f59e0b' : '#ef4444';
	}
</script>

<div class="flex flex-1 flex-col gap-5 p-6 md:p-8">

	<!-- ── Header ──────────────────────────────────────────────────────── -->
	<div class="flex flex-col gap-4">
		<div class="flex items-end justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Análise da Frota</p>
				<h1 class="mt-0.5 text-3xl font-black tracking-tight">Relatórios</h1>
			</div>
			<span class="rounded-full border px-3 py-1 text-xs text-muted-foreground">
				{new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })}
			</span>
		</div>

		<!-- Filter bar -->
		<div class="flex flex-wrap items-center gap-2">
			<select value={activeVehicleId ?? ''} onchange={(e) => setFilter('vehicleId', (e.target as HTMLSelectElement).value)}
				class="h-8 rounded-lg border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring">
				<option value="">Todos os veículos</option>
				{#each filterOptions?.vehicles ?? [] as v (v.id)}
					<option value={v.id}>{v.name}{v.plate ? ` · ${v.plate}` : ''}</option>
				{/each}
			</select>

			<input type="date" value={activeFrom ?? ''} onchange={(e) => setFilter('from', (e.target as HTMLInputElement).value)}
				class="h-8 rounded-lg border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring" />
			<span class="text-xs text-muted-foreground">até</span>
			<input type="date" value={activeTo ?? ''} onchange={(e) => setFilter('to', (e.target as HTMLInputElement).value)}
				class="h-8 rounded-lg border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring" />

			{#if (filterOptions?.categories.length ?? 0) > 0}
				<select value={activeCategoryId ?? ''} onchange={(e) => setFilter('categoryId', (e.target as HTMLSelectElement).value)}
					class="h-8 rounded-lg border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring">
					<option value="">Todas as categorias</option>
					{#each filterOptions?.categories ?? [] as c (c.id)}
						<option value={c.id}>{c.name}</option>
					{/each}
				</select>
			{/if}

			{#if hasFilters}
				<button onclick={clearFilters}
					class="flex h-8 items-center gap-1.5 rounded-lg border border-dashed px-3 text-xs font-medium text-muted-foreground hover:border-foreground hover:text-foreground">
					<XIcon class="size-3" /> Limpar filtros
				</button>
			{/if}

			{#if records}
				<span class="ml-auto text-xs text-muted-foreground">
					{records.total} registro{records.total !== 1 ? 's' : ''} encontrado{records.total !== 1 ? 's' : ''}
				</span>
			{/if}
		</div>
	</div>

	<!-- ── KPI strip ────────────────────────────────────────────────────── -->
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
		<!-- Gauge -->
		<div class="col-span-2 flex flex-col items-center justify-center rounded-2xl border bg-card p-5 shadow-sm lg:col-span-1">
			<p class="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Saúde da Frota</p>
			<svg viewBox="0 0 180 148" class="w-40">
				<circle cx="90" cy="90" r={GAUGE_R} fill="none" stroke="currentColor" class="text-muted/40"
					stroke-width="13" stroke-dasharray="{GAUGE_ARC} {GAUGE_GAP}" stroke-linecap="round" transform="rotate(135 90 90)" />
				<circle cx="90" cy="90" r={GAUGE_R} fill="none" stroke={gaugeColor(data?.fleetHealth ?? 0)}
					stroke-width="13" stroke-dasharray={gaugeDash(data?.fleetHealth ?? 0)} stroke-linecap="round"
					transform="rotate(135 90 90)" style="transition:stroke-dasharray .8s cubic-bezier(.4,0,.2,1),stroke .4s" />
				<text x="90" y="86" text-anchor="middle" dominant-baseline="middle" font-size="34" font-weight="900"
					font-family="ui-monospace,monospace" fill={gaugeColor(data?.fleetHealth ?? 100)}>
					{data?.fleetHealth ?? '—'}
				</text>
				<text x="90" y="108" text-anchor="middle" dominant-baseline="middle" font-size="11"
					fill="currentColor" opacity="0.5">de 100 pts</text>
			</svg>
			<div class="mt-1 flex items-center gap-1.5">
				<span class="size-2 rounded-full" style="background:{gaugeColor(data?.fleetHealth ?? 100)}"></span>
				<span class="text-xs text-muted-foreground">
					{#if (data?.fleetHealth ?? 100) >= 70}Frota saudável
					{:else if (data?.fleetHealth ?? 100) >= 40}Atenção necessária
					{:else}Estado crítico{/if}
				</span>
			</div>
		</div>

		<div class="rounded-2xl border bg-card p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gasto Total</p>
			<p class="mt-3 font-mono text-3xl font-black tabular-nums tracking-tight">{data ? brlC(data.totalCost) : '—'}</p>
			<p class="mt-1 text-xs text-muted-foreground">em manutenções registradas</p>
		</div>

		<div class="rounded-2xl border bg-card p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Custo Médio</p>
			<p class="mt-3 font-mono text-3xl font-black tabular-nums tracking-tight">{data ? brlC(data.avgCost) : '—'}</p>
			<p class="mt-1 text-xs text-muted-foreground">por manutenção</p>
		</div>

		<div class="rounded-2xl border bg-card p-5 shadow-sm" class:border-red-500={!!data && data.vehiclesWithOverdue > 0}>
			<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Em Alerta</p>
			<p class="mt-3 font-mono text-3xl font-black tabular-nums tracking-tight"
				class:text-red-500={!!data && data.vehiclesWithOverdue > 0}>
				{data?.vehiclesWithOverdue ?? '—'}
			</p>
			<p class="mt-1 text-xs text-muted-foreground">veículos com planos atrasados</p>
		</div>

		<div class="rounded-2xl border bg-card p-5 shadow-sm">
			<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Registros</p>
			<p class="mt-3 font-mono text-3xl font-black tabular-nums tracking-tight">{data?.totalRecords ?? '—'}</p>
			<p class="mt-1 text-xs text-muted-foreground">manutenções realizadas</p>
		</div>
	</div>

	<!-- ── Charts row ───────────────────────────────────────────────────── -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
		<!-- Type donut -->
		<div class="rounded-2xl border bg-card p-5 shadow-sm lg:col-span-3">
			<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Por Tipo</p>
			{#if data}
				{@const total = data.typeDistribution.preventive + data.typeDistribution.corrective + data.typeDistribution.emergency}
				<div class="mt-3 flex items-center gap-4">
					<svg viewBox="0 0 140 140" class="w-28 shrink-0">
						{#if total === 0}
							<circle cx="70" cy="70" r={DONUT_R} fill="none" stroke="currentColor" class="text-muted/40" stroke-width="22" />
						{:else}
							{#each typeSegments as seg}
								<circle cx="70" cy="70" r={DONUT_R} fill="none" stroke={seg.color} stroke-width="22"
									stroke-dasharray={seg.dashArray} stroke-dashoffset={seg.dashOffset} transform="rotate(-90 70 70)" />
							{/each}
						{/if}
						<text x="70" y="66" text-anchor="middle" dominant-baseline="middle" font-size="18" font-weight="900"
							font-family="ui-monospace,monospace" fill="currentColor">{total}</text>
						<text x="70" y="82" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="currentColor" opacity="0.5">total</text>
					</svg>
					<div class="flex flex-col gap-2 text-xs">
						{#each [['#3b82f6','Preventiva',data.typeDistribution.preventive],['#f59e0b','Corretiva',data.typeDistribution.corrective],['#ef4444','Emergência',data.typeDistribution.emergency]] as [c,l,n]}
							<div class="flex items-center gap-2">
								<span class="size-2.5 shrink-0 rounded-sm" style="background:{c}"></span>
								<span class="text-muted-foreground">{l}</span>
								<span class="ml-auto font-mono font-bold tabular-nums">{n}</span>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="mt-4 h-28 animate-pulse rounded-xl bg-muted/40"></div>
			{/if}
		</div>

		<!-- Status donut -->
		<div class="rounded-2xl border bg-card p-5 shadow-sm lg:col-span-3">
			<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status dos Planos</p>
			{#if data}
				<div class="mt-3 flex items-center gap-4">
					<svg viewBox="0 0 140 140" class="w-28 shrink-0">
						{#if data.planStatus.total === 0}
							<circle cx="70" cy="70" r={DONUT_R} fill="none" stroke="currentColor" class="text-muted/40" stroke-width="22" />
						{:else}
							{#each statusSegments as seg}
								<circle cx="70" cy="70" r={DONUT_R} fill="none" stroke={seg.color} stroke-width="22"
									stroke-dasharray={seg.dashArray} stroke-dashoffset={seg.dashOffset} transform="rotate(-90 70 70)" />
							{/each}
						{/if}
						<text x="70" y="66" text-anchor="middle" dominant-baseline="middle" font-size="18" font-weight="900"
							font-family="ui-monospace,monospace" fill="currentColor">{data.planStatus.total}</text>
						<text x="70" y="82" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="currentColor" opacity="0.5">planos</text>
					</svg>
					<div class="flex flex-col gap-2 text-xs">
						{#each [['#22c55e','Em dia',data.planStatus.ok],['#f59e0b','Próximos',data.planStatus.upcoming],['#ef4444','Atrasados',data.planStatus.overdue]] as [c,l,n]}
							<div class="flex items-center gap-2">
								<span class="size-2.5 shrink-0 rounded-sm" style="background:{c}"></span>
								<span class="text-muted-foreground">{l}</span>
								<span class="ml-auto font-mono font-bold tabular-nums">{n}</span>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="mt-4 h-28 animate-pulse rounded-xl bg-muted/40"></div>
			{/if}
		</div>

		<!-- Monthly bars -->
		<div class="rounded-2xl border bg-card p-5 shadow-sm lg:col-span-6">
			<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gastos por Mês</p>
			{#if data}
				<div class="mt-3">
					<svg viewBox="0 0 480 120" class="w-full overflow-visible">
						{#each chartData as bar, i}
							{@const bW=52} {#each [i*(bW+28)] as x}
							{@const h=Math.max(2,(bar.value/maxBarValue)*80)} {@const y=80-h}
							<rect {x} {y} width={bW} height={h} rx="5"
								fill={bar.value>0?'#f97316':'currentColor'} class={bar.value>0?'':'text-muted/30'} opacity={bar.value>0?1:0.3} />
							{#if bar.value>0}
								<text x={x+bW/2} y={y-4} text-anchor="middle" font-size="8.5" font-weight="700"
									font-family="ui-monospace,monospace" fill="currentColor" opacity="0.7">{brlC(bar.value)}</text>
							{/if}
							<text x={x+bW/2} y="100" text-anchor="middle" font-size="10" font-weight="600" fill="currentColor" opacity="0.5">{bar.label}</text>
							{/each}
						{/each}
					</svg>
				</div>
			{:else}
				<div class="mt-4 h-28 animate-pulse rounded-xl bg-muted/40"></div>
			{/if}
		</div>
	</div>

	<!-- ── Por Veículo (clicável para filtrar) ───────────────────────────── -->
	<div>
		<p class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Por Veículo
			{#if activeVehicleId}<span class="ml-2 font-normal normal-case text-muted-foreground/60">— clique para remover filtro</span>{:else}<span class="ml-2 font-normal normal-case text-muted-foreground/60">— clique para filtrar</span>{/if}
		</p>
		{#if vehicles.length === 0}
			<div class="rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">Nenhum veículo encontrado.</div>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each vehicles as v (v.id)}
					{@const typeTotal = v.preventiveCount + v.correctiveCount + v.emergencyCount}
					{@const DR=28} {@const DC=2*Math.PI*DR}
					{@const pL=typeTotal>0?(v.preventiveCount/typeTotal)*DC:0}
					{@const cL=typeTotal>0?(v.correctiveCount/typeTotal)*DC:0}
					{@const eL=typeTotal>0?(v.emergencyCount/typeTotal)*DC:0}
					{@const isActive = activeVehicleId===v.id}

					<button
						onclick={() => filterByVehicle(v.id)}
						class="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm text-left transition-all hover:shadow-md
							{isActive ? 'ring-2 ring-foreground' : 'hover:border-foreground/30'}"
					>
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<p class="truncate font-semibold leading-tight">{v.name}</p>
								<p class="text-xs text-muted-foreground">{[v.brand,v.model].filter(Boolean).join(' ')||'Sem modelo'}</p>
							</div>
							<div class="flex shrink-0 flex-col items-end gap-1">
								{#if v.plate}
									<span class="rounded border px-1.5 py-0.5 font-mono text-xs font-bold tracking-widest">{v.plate}</span>
								{/if}
								{#if v.overduePlans>0}
									<span class="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">{v.overduePlans} atras.</span>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-3">
							<svg viewBox="0 0 72 72" class="size-14 shrink-0" aria-hidden="true">
								{#if typeTotal===0}
									<circle cx="36" cy="36" r={DR} fill="none" stroke="currentColor" class="text-muted/30" stroke-width="10" />
								{:else}
									<circle cx="36" cy="36" r={DR} fill="none" stroke="#3b82f6" stroke-width="10" stroke-dasharray="{pL} {DC-pL}" stroke-dashoffset="0" transform="rotate(-90 36 36)" />
									<circle cx="36" cy="36" r={DR} fill="none" stroke="#f59e0b" stroke-width="10" stroke-dasharray="{cL} {DC-cL}" stroke-dashoffset={-pL} transform="rotate(-90 36 36)" />
									<circle cx="36" cy="36" r={DR} fill="none" stroke="#ef4444" stroke-width="10" stroke-dasharray="{eL} {DC-eL}" stroke-dashoffset={-(pL+cL)} transform="rotate(-90 36 36)" />
								{/if}
								<text x="36" y="33" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="900" font-family="ui-monospace,monospace" fill="currentColor">{v.recordCount}</text>
								<text x="36" y="44" text-anchor="middle" dominant-baseline="middle" font-size="7" fill="currentColor" opacity="0.5">reg.</text>
							</svg>
							<div class="min-w-0 flex-1">
								<p class="font-mono text-xl font-black tabular-nums tracking-tight">{brlC(v.totalCost)}</p>
								<p class="text-xs text-muted-foreground">gasto total</p>
								{#if v.lastMaintenance}
									<p class="mt-1 text-xs text-muted-foreground">Última: {new Date(v.lastMaintenance).toLocaleDateString('pt-BR')}</p>
								{/if}
							</div>
						</div>
						{#if v.totalPlans>0}
							<div class="space-y-1">
								<div class="flex justify-between text-xs">
									<span class="text-muted-foreground">{v.totalPlans} planos</span>
									<span style="color:{planHealthColor(v.okPlans,v.totalPlans)}" class="font-semibold">{Math.round((v.okPlans/v.totalPlans)*100)}% ok</span>
								</div>
								<div class="flex h-1.5 overflow-hidden rounded-full bg-muted/30">
									{#if v.okPlans>0}<div class="bg-emerald-500" style="width:{(v.okPlans/v.totalPlans)*100}%"></div>{/if}
									{#if v.upcomingPlans>0}<div class="bg-amber-500" style="width:{(v.upcomingPlans/v.totalPlans)*100}%"></div>{/if}
									{#if v.overduePlans>0}<div class="bg-red-500" style="width:{(v.overduePlans/v.totalPlans)*100}%"></div>{/if}
								</div>
							</div>
						{/if}
						{#if v.currentKm>0}
							<p class="font-mono text-xs text-muted-foreground">{v.currentKm.toLocaleString('pt-BR')} km</p>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- ── Top 5 ─────────────────────────────────────────────────────────── -->
	{#if data && data.topVehicles.length > 0}
		<div class="rounded-2xl border bg-card p-5 shadow-sm">
			<p class="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Top Veículos por Custo</p>
			<div class="flex flex-col gap-3">
				{#each data.topVehicles as vehicle, i}
					{@const barPct=(vehicle.totalCost/topMax)*100}
					<div class="flex items-center gap-3">
						<span class="w-5 shrink-0 font-mono text-xs font-bold text-muted-foreground">#{i+1}</span>
						<div class="w-36 shrink-0">
							<p class="truncate text-sm font-semibold leading-tight">{vehicle.vehicleName}</p>
							{#if vehicle.vehiclePlate}<p class="font-mono text-xs text-muted-foreground">{vehicle.vehiclePlate}</p>{/if}
						</div>
						<div class="relative h-5 flex-1 overflow-hidden rounded-full bg-muted/30">
							<div class="absolute inset-y-0 left-0 rounded-full"
								style="width:{barPct}%;background:{i===0?'#f97316':i===1?'#fb923c':'#fdba74'};transition:width .6s cubic-bezier(.4,0,.2,1)"></div>
						</div>
						<span class="w-24 shrink-0 text-right font-mono text-sm font-bold tabular-nums">{brl(vehicle.totalCost)}</span>
						<span class="w-16 shrink-0 text-right text-xs text-muted-foreground">{vehicle.recordCount} reg.</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- ── Tabela de despesas ─────────────────────────────────────────────── -->
	<div class="rounded-2xl border bg-card shadow-sm">
		<!-- Table header -->
		<div class="flex items-center justify-between border-b px-5 py-3.5">
			<p class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
				Despesas
				{#if records}<span class="ml-1 font-mono text-foreground">{records.total}</span>{/if}
			</p>
			{#if records && records.total > 0}
				<span class="font-mono text-sm font-bold tabular-nums">{brl(records.totalCost)}</span>
			{/if}
		</div>

		<!-- Loading skeleton -->
		{#if loading && !records}
			<div class="divide-y">
				{#each Array(5) as _}
					<div class="flex items-center gap-4 px-5 py-3">
						<div class="h-3 w-20 animate-pulse rounded bg-muted/60"></div>
						<div class="h-3 w-32 animate-pulse rounded bg-muted/60"></div>
						<div class="h-3 w-16 animate-pulse rounded bg-muted/40"></div>
						<div class="ml-auto h-3 w-16 animate-pulse rounded bg-muted/40"></div>
					</div>
				{/each}
			</div>
		{:else if records && records.records.length === 0}
			<div class="px-5 py-12 text-center text-sm text-muted-foreground">
				Nenhuma despesa encontrada com os filtros aplicados.
			</div>
		{:else if records}
			<!-- Sort header -->
			<div class="grid grid-cols-[120px_1fr_100px_120px_1fr_100px] items-center gap-2 border-b bg-muted/20 px-5 py-2 text-xs font-semibold text-muted-foreground">
				<button class="flex items-center gap-1 hover:text-foreground" onclick={() => toggleSort('date')}>
					Data
					{#if activeSort==='date'}
						{#if activeDir==='asc'}<ChevronUpIcon class="size-3"/>{:else}<ChevronDownIcon class="size-3"/>{/if}
					{:else}<ChevronsUpDownIcon class="size-3 opacity-40"/>{/if}
				</button>
				<span>Veículo</span>
				<span>Tipo</span>
				<span>Categoria</span>
				<span>Oficina</span>
				<button class="flex items-center justify-end gap-1 hover:text-foreground" onclick={() => toggleSort('cost')}>
					{#if activeSort==='cost'}
						{#if activeDir==='asc'}<ChevronUpIcon class="size-3"/>{:else}<ChevronDownIcon class="size-3"/>{/if}
					{:else}<ChevronsUpDownIcon class="size-3 opacity-40"/>{/if}
					Custo
				</button>
			</div>

			<!-- Rows -->
			<div class="divide-y" class:opacity-60={loading}>
				{#each records.records as rec (rec.id)}
					<div class="grid grid-cols-[120px_1fr_100px_120px_1fr_100px] items-center gap-2 px-5 py-2.5 text-sm transition-colors hover:bg-muted/20">
						<span class="font-mono text-xs tabular-nums text-muted-foreground">
							{new Date(rec.date).toLocaleDateString('pt-BR')}
						</span>
						<div class="min-w-0">
							<p class="truncate font-medium leading-tight">{rec.vehicleName}</p>
							{#if rec.vehiclePlate}<p class="font-mono text-xs text-muted-foreground">{rec.vehiclePlate}</p>{/if}
						</div>
						<span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium {typeColor[rec.type] ?? ''}">
							{typeLabel[rec.type] ?? rec.type}
						</span>
						<span class="truncate text-xs text-muted-foreground">{rec.categoryName ?? '—'}</span>
						<span class="truncate text-xs text-muted-foreground">{rec.workshop ?? '—'}</span>
						<span class="text-right font-mono text-sm font-semibold tabular-nums">
							{rec.cost !== null ? brl(rec.cost) : '—'}
						</span>
					</div>
				{/each}
			</div>

			<!-- Pagination -->
			{#if records.pageCount > 1}
				<div class="flex items-center justify-between border-t px-5 py-3">
					<span class="text-xs text-muted-foreground">
						Página {records.page + 1} de {records.pageCount}
						· {records.total} registros
					</span>
					<div class="flex items-center gap-1">
						<button
							onclick={() => goPage(records.page - 1)}
							disabled={records.page === 0}
							class="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-muted"
						>
							Anterior
						</button>
						{#each Array.from({length: Math.min(records.pageCount, 7)}, (_, i) => {
							const mid = Math.min(Math.max(records.page, 3), records.pageCount - 4);
							return records.pageCount <= 7 ? i : i + Math.max(0, mid - 3);
						}) as pg}
							<button
								onclick={() => goPage(pg)}
								class="min-w-[2rem] rounded-lg border px-2 py-1.5 text-xs font-medium hover:bg-muted
									{pg === records.page ? 'bg-foreground text-background border-foreground' : ''}"
							>
								{pg + 1}
							</button>
						{/each}
						<button
							onclick={() => goPage(records.page + 1)}
							disabled={records.page >= records.pageCount - 1}
							class="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-muted"
						>
							Próximo
						</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>

</div>
