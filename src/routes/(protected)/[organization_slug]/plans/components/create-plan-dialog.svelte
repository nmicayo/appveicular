<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { createPlan } from '$lib/remote/maintenance-plan.remote';
	import { getVehicles } from '$lib/remote/vehicle.remote';
	import { getCategories } from '$lib/remote/maintenance-record.remote.js';
	import CategoryCombobox from '$lib/components/category-combobox.svelte';
	import { isHttpError } from '@sveltejs/kit';
	import { isValidationError, extractFieldErrors } from '$lib/utils/validation-errors.js';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import { page } from '$app/state';

	let { open = $bindable() }: { open: boolean } = $props();

	const slug = page.params.organization_slug!;
	const vehiclesQuery = $derived(getVehicles({ organizationSlug: slug }));
	const vehicles = $derived(vehiclesQuery.current ?? []);
	const categoriesQuery = $derived(getCategories({ organizationSlug: slug }));
	const existingCategories = $derived(categoriesQuery.current ?? []);

	let error = $state<string | undefined>();
	let fieldErrors = $state<Record<string, string>>({});
	let isLoading = $state(false);
	let selectedVehicleId = $state('');
	let selectedTriggerType = $state('km');
	let selectedCategory = $state('');

	$effect(() => {
		if (!open) {
			error = undefined;
			fieldErrors = {};
			selectedVehicleId = '';
			selectedTriggerType = 'km';
			selectedCategory = '';
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="gap-0 p-0 sm:max-w-lg">
		<Dialog.Header class="border-b px-5 py-3.5">
			<Dialog.Title class="text-base font-semibold">Novo Plano de Manutenção</Dialog.Title>
			<Dialog.Description class="text-sm text-muted-foreground">
				Configure uma programação de manutenção recorrente para um veículo.
			</Dialog.Description>
		</Dialog.Header>

		<form
			{...createPlan.enhance(async ({ submit }) => {
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

					<Field.Field class="col-span-2 gap-1.5">
						<Field.Label for="plan-name" class="text-sm font-medium">
							Nome do Plano <span class="text-destructive">*</span>
						</Field.Label>
						<input
							id="plan-name"
							name="name"
							type="text"
							placeholder="Troca de óleo, Rodízio de pneus..."
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring {fieldErrors.name ? 'border-destructive' : ''}"
						/>
						{#if fieldErrors.name}
							<Field.Error>{fieldErrors.name}</Field.Error>
						{/if}
					</Field.Field>

					<Field.Field class="col-span-2 gap-1.5">
						<Field.Label for="plan-description" class="text-sm font-medium">Descrição</Field.Label>
						<textarea
							id="plan-description"
							name="description"
							rows={2}
							placeholder="O que este plano cobre..."
							class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
						></textarea>
					</Field.Field>

					<Field.Field class="col-span-2 gap-1.5">
						<Field.Label class="text-sm font-medium">Categoria</Field.Label>
						<CategoryCombobox
							name="category"
							bind:value={selectedCategory}
							{existingCategories}
						/>
					</Field.Field>

					<Field.Field class="col-span-2 gap-1.5">
						<Field.Label class="text-sm font-medium">
							Tipo de Gatilho <span class="text-destructive">*</span>
						</Field.Label>
						<Select.Root
							type="single"
							allowDeselect={false}
							name="triggerType"
							bind:value={selectedTriggerType}
						>
							<Select.Trigger class="w-full">
								{selectedTriggerType === 'km' ? 'Por Quilômetros' : selectedTriggerType === 'days' ? 'Por Dias' : 'KM e Dias'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="km">Por Quilômetros</Select.Item>
								<Select.Item value="days">Por Dias</Select.Item>
								<Select.Item value="both">KM e Dias</Select.Item>
							</Select.Content>
						</Select.Root>
					</Field.Field>

					{#if selectedTriggerType === 'km' || selectedTriggerType === 'both'}
						<Field.Field class="gap-1.5">
							<Field.Label for="triggerKm" class="text-sm font-medium">A cada (km)</Field.Label>
							<input
								id="triggerKm"
								name="triggerKm"
								type="number"
								min="1"
								placeholder="5000"
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>
						<Field.Field class="gap-1.5">
							<Field.Label for="leadTimeKm" class="text-sm font-medium">Antecedência (km)</Field.Label>
							<input
								id="leadTimeKm"
								name="leadTimeKm"
								type="number"
								min="0"
								placeholder="500"
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>
					{/if}

					{#if selectedTriggerType === 'days' || selectedTriggerType === 'both'}
						<Field.Field class="gap-1.5">
							<Field.Label for="triggerDays" class="text-sm font-medium">A cada (dias)</Field.Label>
							<input
								id="triggerDays"
								name="triggerDays"
								type="number"
								min="1"
								placeholder="180"
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>
						<Field.Field class="gap-1.5">
							<Field.Label for="leadTimeDays" class="text-sm font-medium">Antecedência (dias)</Field.Label>
							<input
								id="leadTimeDays"
								name="leadTimeDays"
								type="number"
								min="0"
								placeholder="14"
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>
					{/if}

					<Field.Field class="gap-1.5">
						<Field.Label for="lastDoneKm" class="text-sm font-medium">Última vez (km)</Field.Label>
						<input
							id="lastDoneKm"
							name="lastDoneKm"
							type="number"
							min="0"
							placeholder="145000"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="lastDoneDate" class="text-sm font-medium">Última vez (data)</Field.Label>
						<input
							id="lastDoneDate"
							name="lastDoneDate"
							type="date"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</Field.Field>
				</div>
			</div>

			<Dialog.Footer class="border-t bg-muted/30 px-5 py-3">
				<Button type="button" variant="ghost" size="sm" onclick={() => (open = false)}>Cancelar</Button>
				<Button type="submit" size="sm" disabled={isLoading}>
					{#if isLoading}
						<Spinner class="mr-2 size-4" />
						Criando...
					{:else}
						Criar plano
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
