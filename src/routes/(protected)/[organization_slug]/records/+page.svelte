<script lang="ts">
	import { page } from '$app/state';
	import { getRecords, deleteRecord } from '$lib/remote/maintenance-record.remote';
	import { getVehicles } from '$lib/remote/vehicle.remote';
	import type { MaintenanceRecord } from '$lib/schemas/maintenance-record';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ToolIcon from '@tabler/icons-svelte/icons/tool';
	import CreateRecordDialog from './components/create-record-dialog.svelte';
	import EditRecordDialog from './components/edit-record-dialog.svelte';

	const slug = page.params.organization_slug!;
	const recordsQuery = $derived(getRecords({ organizationSlug: slug }));
	const vehiclesQuery = $derived(getVehicles({ organizationSlug: slug }));

	const vehicleMap = $derived(
		Object.fromEntries((vehiclesQuery.current ?? []).map((v) => [v.id, v]))
	);

	let showCreate = $state(false);
	let editingRecord = $state<MaintenanceRecord | undefined>();
	let showEdit = $state(false);

	function handleEdit(record: MaintenanceRecord) {
		editingRecord = { ...record };
		showEdit = true;
	}

	async function handleDelete(id: string) {
		if (!confirm('Tem certeza que deseja excluir este registro?')) return;
		try {
			await deleteRecord({ organizationSlug: slug, id });
		} catch (err) {
			console.error('Failed to delete record:', err);
		}
	}

	const typeLabel: Record<string, string> = {
		preventive: 'Preventiva',
		corrective: 'Corretiva',
		emergency: 'Emergência'
	};

	const typeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		preventive: 'secondary',
		corrective: 'default',
		emergency: 'destructive'
	};
</script>

<div class="hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
	<div class="flex items-center justify-between gap-2">
		<div class="flex flex-col gap-1">
			<h2 class="text-2xl font-semibold tracking-tight">Registros de Manutenção</h2>
			<p class="text-muted-foreground">Histórico de todos os eventos de manutenção.</p>
		</div>
		<Button onclick={() => (showCreate = true)} variant="default">
			<CirclePlusIcon class="mr-2 size-4" />
			Adicionar Registro
		</Button>
	</div>

	{#if recordsQuery.loading}
		<div class="py-8 text-center">
			<p class="text-muted-foreground">Carregando registros...</p>
		</div>
	{:else if recordsQuery.error}
		<div class="py-8 text-center">
			<p class="text-destructive">Falha ao carregar registros. Tente novamente.</p>
		</div>
	{:else if recordsQuery.current && recordsQuery.current.length > 0}
		<div class="rounded-xl border bg-card shadow-sm">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b text-left text-muted-foreground">
						<th class="px-5 py-3 font-medium">Data</th>
						<th class="px-5 py-3 font-medium">Veículo</th>
						<th class="px-5 py-3 font-medium">Tipo</th>
						<th class="px-5 py-3 font-medium">Categoria</th>
						<th class="px-5 py-3 font-medium">Oficina</th>
						<th class="px-5 py-3 text-right font-medium">Custo</th>
						<th class="px-5 py-3 font-medium">KM</th>
						<th class="px-5 py-3 w-20"></th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each recordsQuery.current as record (record.id)}
						{@const vehicle = vehicleMap[record.vehicleId]}
						<tr class="hover:bg-muted/30 transition-colors">
							<td class="px-5 py-3 whitespace-nowrap">
								{new Date(record.date).toLocaleDateString('pt-BR')}
							</td>
							<td class="px-5 py-3">
								{#if vehicle}
									<div class="flex flex-col">
										<span class="font-medium">{vehicle.name}</span>
										{#if vehicle.plate}
											<span class="text-xs text-muted-foreground font-mono">{vehicle.plate}</span>
										{/if}
									</div>
								{:else}
									<span class="text-muted-foreground text-xs">Desconhecido</span>
								{/if}
							</td>
							<td class="px-5 py-3">
								<Badge variant={typeVariant[record.type] ?? 'outline'}>
									{typeLabel[record.type] ?? record.type}
								</Badge>
							</td>
							<td class="px-5 py-3 text-muted-foreground">{record.categoryName ?? '—'}</td>
							<td class="px-5 py-3 text-muted-foreground">{record.workshop ?? '—'}</td>
							<td class="px-5 py-3 text-right">
								{#if record.cost !== null}
									{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.cost)}
								{:else}
									—
								{/if}
							</td>
							<td class="px-5 py-3 text-muted-foreground">
								{record.odometerKm !== null ? record.odometerKm.toLocaleString('pt-BR') + ' km' : '—'}
							</td>
							<td class="px-5 py-3">
								<div class="flex gap-1">
									<Button
										variant="ghost"
										size="icon"
										class="size-8"
										onclick={() => handleEdit(record)}
									>
										<PencilIcon class="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="size-8 text-destructive hover:text-destructive"
										onclick={() => handleDelete(record.id)}
									>
										<Trash2Icon class="size-4" />
									</Button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card py-16">
			<ToolIcon class="size-12 text-muted-foreground/50" />
			<div class="text-center">
				<p class="font-medium">Nenhum registro ainda</p>
				<p class="text-sm text-muted-foreground">Registre seu primeiro evento de manutenção.</p>
			</div>
			<Button onclick={() => (showCreate = true)} variant="outline">
				<CirclePlusIcon class="mr-2 size-4" />
				Adicionar Registro
			</Button>
		</div>
	{/if}
</div>

<CreateRecordDialog bind:open={showCreate} />
<EditRecordDialog bind:open={showEdit} bind:record={editingRecord} />
