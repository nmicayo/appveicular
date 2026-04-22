<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { createRecord } from '$lib/remote/maintenance-record.remote';
	import { getVehicles } from '$lib/remote/vehicle.remote';
	import { isHttpError } from '@sveltejs/kit';
	import { isValidationError, extractFieldErrors } from '$lib/utils/validation-errors.js';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import { page } from '$app/state';
	import { getCategories } from '$lib/remote/maintenance-record.remote.js';
	import CategoryCombobox from '$lib/components/category-combobox.svelte';

	let { open = $bindable() }: { open: boolean } = $props();

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
		if (!open) {
			error = undefined;
			fieldErrors = {};
			selectedType = 'preventive';
			selectedVehicleId = '';
			selectedCategory = '';
		}
	});

	const today = new Date().toISOString().slice(0, 10);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="gap-0 p-0 sm:max-w-lg">
		<Dialog.Header class="border-b px-5 py-3.5">
			<Dialog.Title class="text-base font-semibold">Novo Registro de Manutenção</Dialog.Title>
			<Dialog.Description class="text-sm text-muted-foreground">
				Registre um evento de manutenção para um veículo.
			</Dialog.Description>
		</Dialog.Header>

		<form
			{...createRecord.enhance(async ({ submit }) => {
				error = undefined;
				fieldErrors = {};
				isLoading = true;
				try {
					await submit();
					open = false;
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

			<div class="space-y-3.5 px-5 py-4">
				{#if error}
					<Alert.Root variant="destructive" class="py-2.5">
						<CircleAlertIcon class="size-4" />
						<Alert.Description class="text-sm">{error}</Alert.Description>
					</Alert.Root>
				{/if}

				<div class="grid gap-3.5 sm:grid-cols-2">
					<Field.Field class="col-span-2 gap-1.5">
						<Field.Label for="vehicleId" class="text-sm font-medium">
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
						<Field.Label for="type" class="text-sm font-medium">
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
						{#if fieldErrors.type}
							<Field.Error>{fieldErrors.type}</Field.Error>
						{/if}
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="date" class="text-sm font-medium">
							Data <span class="text-destructive">*</span>
						</Field.Label>
						<input
							id="date"
							name="date"
							type="date"
							value={today}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring {fieldErrors.date ? 'border-destructive' : ''}"
						/>
						{#if fieldErrors.date}
							<Field.Error>{fieldErrors.date}</Field.Error>
						{/if}
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="odometerKm" class="text-sm font-medium">Odômetro (km)</Field.Label>
						<input
							id="odometerKm"
							name="odometerKm"
							type="number"
							min="0"
							placeholder="150000"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="cost" class="text-sm font-medium">Custo (R$)</Field.Label>
						<input
							id="cost"
							name="cost"
							type="number"
							min="0"
							step="0.01"
							placeholder="0,00"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="workshop" class="text-sm font-medium">Oficina</Field.Label>
						<input
							id="workshop"
							name="workshop"
							type="text"
							placeholder="Nome da Oficina"
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
						<Field.Label for="reportedProblem" class="text-sm font-medium">Problema Relatado</Field.Label>
						<textarea
							id="reportedProblem"
							name="reportedProblem"
							rows={2}
							placeholder="Descreva o problema relatado..."
							class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
						></textarea>
					</Field.Field>

					<Field.Field class="col-span-2 gap-1.5">
						<Field.Label for="notes" class="text-sm font-medium">Observações</Field.Label>
						<textarea
							id="notes"
							name="notes"
							rows={2}
							placeholder="Observações adicionais..."
							class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
						></textarea>
					</Field.Field>
				</div>
			</div>

			<Dialog.Footer class="border-t bg-muted/30 px-5 py-3">
				<Button type="button" variant="ghost" size="sm" onclick={() => (open = false)}>Cancelar</Button>
				<Button type="submit" size="sm" disabled={isLoading}>
					{#if isLoading}
						<Spinner class="mr-2 size-4" />
						Salvando...
					{:else}
						Salvar registro
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
