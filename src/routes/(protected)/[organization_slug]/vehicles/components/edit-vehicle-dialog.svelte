<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { updateVehicle } from '$lib/remote/vehicle.remote';
	import type { Vehicle } from '$lib/schemas/vehicle';
	import { isHttpError } from '@sveltejs/kit';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import { page } from '$app/state';

	let {
		open = $bindable(),
		vehicle = $bindable()
	}: { open: boolean; vehicle: Vehicle | undefined } = $props();

	let error = $state<string | undefined>();
	let isLoading = $state(false);

	$effect(() => {
		if (!open) {
			error = undefined;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="gap-0 p-0 sm:max-w-lg">
		<Dialog.Header class="border-b px-5 py-3.5">
			<Dialog.Title class="text-base font-semibold">Editar Veículo</Dialog.Title>
			<Dialog.Description class="text-sm text-muted-foreground">
				Atualizar informações do veículo.
			</Dialog.Description>
		</Dialog.Header>

		{#if vehicle}
			<form
				{...updateVehicle.enhance(async ({ submit }) => {
					error = undefined;
					isLoading = true;
					try {
						await submit();
						open = false;
						vehicle = undefined;
					} catch (err) {
						if (isHttpError(err)) {
							error = err.body.message;
						} else {
							error = 'Ocorreu um erro inesperado. Tente novamente.';
						}
					} finally {
						isLoading = false;
					}
				})}
				class="flex flex-col"
			>
				<input type="hidden" name="organizationSlug" value={page.params.organization_slug} />
				<input type="hidden" name="id" value={vehicle.id} />

				<div class="space-y-3.5 px-5 py-4">
					{#if error}
						<Alert.Root variant="destructive" class="py-2.5">
							<CircleAlertIcon class="size-4" />
							<Alert.Description class="text-sm">{error}</Alert.Description>
						</Alert.Root>
					{/if}

					<div class="grid gap-3.5 sm:grid-cols-2">
						<Field.Field class="gap-1.5">
							<Field.Label for="edit-name" class="text-sm font-medium">
								Nome <span class="text-destructive">*</span>
							</Field.Label>
							<input
								id="edit-name"
								name="name"
								type="text"
								value={vehicle.name}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label for="edit-nickname" class="text-sm font-medium">Apelido</Field.Label>
							<input
								id="edit-nickname"
								name="nickname"
								type="text"
								value={vehicle.nickname ?? ''}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label for="edit-brand" class="text-sm font-medium">Marca</Field.Label>
							<input
								id="edit-brand"
								name="brand"
								type="text"
								value={vehicle.brand ?? ''}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label for="edit-model" class="text-sm font-medium">Modelo</Field.Label>
							<input
								id="edit-model"
								name="model"
								type="text"
								value={vehicle.model ?? ''}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label for="edit-year" class="text-sm font-medium">Ano</Field.Label>
							<input
								id="edit-year"
								name="year"
								type="number"
								value={vehicle.year ?? ''}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label for="edit-plate" class="text-sm font-medium">Placa</Field.Label>
							<input
								id="edit-plate"
								name="plate"
								type="text"
								value={vehicle.plate ?? ''}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label for="edit-currentKm" class="text-sm font-medium">KM Atual</Field.Label>
							<input
								id="edit-currentKm"
								name="currentKm"
								type="number"
								value={vehicle.currentKm}
								min="0"
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label for="edit-fuelType" class="text-sm font-medium">Combustível</Field.Label>
							<input
								id="edit-fuelType"
								name="fuelType"
								type="text"
								value={vehicle.fuelType ?? ''}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>

						<Field.Field class="col-span-2 gap-1.5">
							<Field.Label for="edit-engine" class="text-sm font-medium">Motor</Field.Label>
							<input
								id="edit-engine"
								name="engine"
								type="text"
								value={vehicle.engine ?? ''}
								class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</Field.Field>

						<Field.Field class="col-span-2 gap-1.5">
							<Field.Label for="edit-notes" class="text-sm font-medium">Observações</Field.Label>
							<textarea
								id="edit-notes"
								name="notes"
								rows={2}
								class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
							>{vehicle.notes ?? ''}</textarea>
						</Field.Field>
					</div>
				</div>

				<Dialog.Footer class="border-t bg-muted/30 px-5 py-3">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onclick={() => {
							open = false;
							vehicle = undefined;
						}}
					>
						Cancelar
					</Button>
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
