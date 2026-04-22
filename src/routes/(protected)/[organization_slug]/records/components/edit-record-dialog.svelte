<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { updateRecord, getCategories } from '$lib/remote/maintenance-record.remote';
	import { getVehicles } from '$lib/remote/vehicle.remote';
	import type { MaintenanceRecord } from '$lib/schemas/maintenance-record';
	import { isHttpError } from '@sveltejs/kit';
	import { isValidationError, extractFieldErrors } from '$lib/utils/validation-errors.js';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import { page } from '$app/state';
	import CategoryCombobox from '$lib/components/category-combobox.svelte';

	let {
		open = $bindable(),
		record = $bindable()
	}: { open: boolean; record: MaintenanceRecord | undefined } = $props();

	const slug = page.params.organization_slug!;
	const vehiclesQuery = $derived(getVehicles({ organizationSlug: slug }));
	const vehicles = $derived(vehiclesQuery.current ?? []);
	const categoriesQuery = $derived(getCategories({ organizationSlug: slug }));
	const existingCategories = $derived(categoriesQuery.current ?? []);

	let error = $state<string | undefined>();
	let fieldErrors = $state<Record<string, string>>({});
	let isLoading = $state(false);
	let selectedType = $state('preventive');
	let selectedVehicleId = $state('');
	let selectedCategory = $state('');

	$effect(() => {
		if (open && record) {
			selectedType = record.type;
			selectedVehicleId = record.vehicleId;
			selectedCategory = record.categoryName ?? '';
		}
		if (!open) {
			error = undefined;
			fieldErrors = {};
		}
	});

	function formatDate(date: Date | string) {
		return new Date(date).toISOString().slice(0, 10);
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="gap-0 p-0 sm:max-w-lg">
		<Dialog.Header class="border-b px-5 py-3.5">
			<Dialog.Title class="text-base font-semibold">Editar Registro</Dialog.Title>
			<Dialog.Description class="text-sm text-muted-foreground">
				Atualize as informações do registro de manutenção.
			</Dialog.Description>
		</Dialog.Header>

		{#if record}
			<form
				{...updateRecord.enhance(async ({ submit }) => {
					error = undefined;
					fieldErrors = {};
					isLoading = true;
					try {
						await submit();
						open = false;
						record = undefined;
					} catch (err) {
						if (isHttpError(err)) {
							if (isValidationError(err.body)) {
								fieldErrors = extractFieldErrors(err.body.errors.nested);
								error = 'Por favor, corrija os erros abaixo.';
							} else {
								error = err.body.message;
							}
						} else {
							error = 'Ocorreu um erro inesperado. Tente novamente.';
						}
					} finally {
						isLoading = false;
					}
				})}
				class="flex flex-col"
			>
				<input type="hidden" name="organizationSlug" value={slug} />
				<input type="hidden" name="id" value={record.id} />

				<div class="space-y-3.5 px-5 py-4">
					{#if error}
						<Alert.Root variant="destructive" class="py-2.5">
							<CircleAlertIcon class="size-4" />
							<Alert.Description class="text-sm">{error}</Alert.Description>
						</Alert.Root>
					{/if}

					<div class="grid gap-3.5 sm:grid-cols-2">
						<Field.Field class="col-span-2 gap-1.5">
							<Field.Label class="text-sm font-medium">
								Veículo <span class="text-destructive">*</span>
							</Field.Label>
							<Select.Root
								type="single"
								allowDeselect={false}
								name="vehicleId"
								bind:value={selectedVehicleId}
							>
								<Select.Trigger class="w-full {fieldErrors.vehicleId ? 'border-destructive' : ''}">
									{vehicles.find((v) => v.id === selectedVehicleId)?.name ?? 'Selecionar veículo...'}
								</Select.Trigger>
								<Select.Content>
									{#each vehicles as v (v.id)}
										<Select.Item value={v.id}>
											{v.name}{v.plate ? ` (${v.plate})` : ''}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							{#if fieldErrors.vehicleId}
								<Field.Error>{fieldErrors.vehicleId}</Field.Error>
							{/if}
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label class="text-sm font-medium">
								Tipo <span class="text-destructive">*</span>
							</Field.Label>
							<Select.Root
								type="single"
								allowDeselect={false}
								name="type"
								bind:value={selectedType}
							>
								<Select.Trigger class="w-full {fieldErrors.type ? 'border-destructive' : ''}">
									{selectedType === 'preventive' ? 'Preventiva' : selectedType === 'corrective' ? 'Corretiva' : 'Emergência'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="preventive">Preventiva</Select.Item>
									<Select.Item value="corrective">Corretiva</Select.Item>
									<Select.Item value="emergency">Emergência</Select.Item>
								</Select.Content>
							</Select.Root>
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label for="edit-date" class="text-sm font-medium">
								Data <span class="text-destructive">*</span>
							</Field.Label>
							<input
								id="edit-date"
								name="date"
								type="date"
								value={formatDate(record.date)}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring {fieldErrors.date ? 'border-destructive' : ''}"
							/>
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label for="edit-odometerKm" class="text-sm font-medium">Odômetro (km)</Field.Label>
							<input
								id="edit-odometerKm"
								name="odometerKm"
								type="number"
								min="0"
								value={record.odometerKm ?? ''}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label for="edit-cost" class="text-sm font-medium">Custo (R$)</Field.Label>
							<input
								id="edit-cost"
								name="cost"
								type="number"
								min="0"
								step="0.01"
								value={record.cost ?? ''}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label for="edit-workshop" class="text-sm font-medium">Oficina</Field.Label>
							<input
								id="edit-workshop"
								name="workshop"
								type="text"
								value={record.workshop ?? ''}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label class="text-sm font-medium">Categoria</Field.Label>
							<CategoryCombobox
								name="category"
								bind:value={selectedCategory}
								{existingCategories}
							/>
						</Field.Field>

						<Field.Field class="col-span-2 gap-1.5">
							<Field.Label for="edit-reportedProblem" class="text-sm font-medium">Problema Relatado</Field.Label>
							<textarea
								id="edit-reportedProblem"
								name="reportedProblem"
								rows={2}
								class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
							>{record.reportedProblem ?? ''}</textarea>
						</Field.Field>

						<Field.Field class="col-span-2 gap-1.5">
							<Field.Label for="edit-notes" class="text-sm font-medium">Observações</Field.Label>
							<textarea
								id="edit-notes"
								name="notes"
								rows={2}
								class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
							>{record.notes ?? ''}</textarea>
						</Field.Field>
					</div>
				</div>

				<Dialog.Footer class="border-t bg-muted/30 px-5 py-3">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onclick={() => { open = false; record = undefined; }}
					>Cancelar</Button>
					<Button type="submit" size="sm" disabled={isLoading}>
						{#if isLoading}
							<Spinner class="mr-2 size-4" />
							Salvando...
						{:else}
							Salvar alterações
						{/if}
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
