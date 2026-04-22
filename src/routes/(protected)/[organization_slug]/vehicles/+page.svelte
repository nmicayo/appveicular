<script lang="ts">
	import { page } from '$app/state';
	import { getVehicles, deleteVehicle } from '$lib/remote/vehicle.remote';
	import type { Vehicle } from '$lib/schemas/vehicle';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import CarIcon from '@tabler/icons-svelte/icons/car';
	import CreateVehicleDialog from './components/create-vehicle-dialog.svelte';
	import EditVehicleDialog from './components/edit-vehicle-dialog.svelte';

	const slug = page.params.organization_slug!;
	const vehiclesQuery = $derived(getVehicles({ organizationSlug: slug }));

	let showCreate = $state(false);
	let editingVehicle = $state<Vehicle | undefined>();
	let showEdit = $state(false);

	function handleEdit(vehicle: Vehicle) {
		editingVehicle = { ...vehicle };
		showEdit = true;
	}

	async function handleDelete(id: string) {
		if (!confirm('Tem certeza que deseja excluir este veículo?')) return;
		try {
			await deleteVehicle({ organizationSlug: slug!, id });
		} catch (err) {
			console.error('Failed to delete vehicle:', err);
		}
	}
</script>

<div class="hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
	<div class="flex items-center justify-between gap-2">
		<div class="flex flex-col gap-1">
			<h2 class="text-2xl font-semibold tracking-tight">Veículos</h2>
			<p class="text-muted-foreground">Gerencie os veículos da sua frota.</p>
		</div>
		<Button onclick={() => (showCreate = true)} variant="default">
			<CirclePlusIcon class="mr-2 size-4" />
			Adicionar Veículo
		</Button>
	</div>

	{#if vehiclesQuery.loading}
		<div class="py-8 text-center">
			<p class="text-muted-foreground">Carregando veículos...</p>
		</div>
	{:else if vehiclesQuery.error}
		<div class="py-8 text-center">
			<p class="text-destructive">Falha ao carregar veículos. Tente novamente.</p>
		</div>
	{:else if vehiclesQuery.current && vehiclesQuery.current.length > 0}
		<div class="rounded-xl border bg-card shadow-sm">
			<div class="divide-y">
				{#each vehiclesQuery.current as vehicle (vehicle.id)}
					<div class="flex items-center gap-4 px-5 py-4">
						<div class="flex size-10 items-center justify-center rounded-lg bg-muted">
							<CarIcon class="size-5 text-muted-foreground" />
						</div>
						<div class="flex flex-1 flex-col gap-0.5">
							<div class="flex items-center gap-2">
								<p class="font-semibold">{vehicle.name}</p>
								{#if vehicle.nickname}
									<span class="text-sm text-muted-foreground">"{vehicle.nickname}"</span>
								{/if}
								{#if vehicle.plate}
									<Badge variant="outline" class="font-mono text-xs">{vehicle.plate}</Badge>
								{/if}
							</div>
							<p class="text-sm text-muted-foreground">
								{[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' · ')}
								{#if vehicle.fuelType}
									· {vehicle.fuelType}
								{/if}
							</p>
						</div>
						<div class="flex items-center gap-4">
							<div class="text-right">
								<p class="text-sm font-medium">{vehicle.currentKm.toLocaleString('pt-BR')} km</p>
								<p class="text-xs text-muted-foreground">odômetro</p>
							</div>
							<div class="flex gap-1">
								<Button
									variant="ghost"
									size="icon"
									class="size-8"
									onclick={() => handleEdit(vehicle)}
								>
									<PencilIcon class="size-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="size-8 text-destructive hover:text-destructive"
									onclick={() => handleDelete(vehicle.id)}
								>
									<Trash2Icon class="size-4" />
								</Button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card py-16">
			<CarIcon class="size-12 text-muted-foreground/50" />
			<div class="text-center">
				<p class="font-medium">Nenhum veículo ainda</p>
				<p class="text-sm text-muted-foreground">Adicione seu primeiro veículo para começar.</p>
			</div>
			<Button onclick={() => (showCreate = true)} variant="outline">
				<CirclePlusIcon class="mr-2 size-4" />
				Adicionar Veículo
			</Button>
		</div>
	{/if}
</div>

<CreateVehicleDialog bind:open={showCreate} />
<EditVehicleDialog bind:open={showEdit} bind:vehicle={editingVehicle} />
