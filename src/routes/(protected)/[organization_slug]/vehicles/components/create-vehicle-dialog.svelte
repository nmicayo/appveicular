<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { createVehicle } from '$lib/remote/vehicle.remote';
	import { isHttpError } from '@sveltejs/kit';
	import { isValidationError, extractFieldErrors } from '$lib/utils/validation-errors.js';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import { page } from '$app/state';

	let { open = $bindable() }: { open: boolean } = $props();

	let error = $state<string | undefined>();
	let fieldErrors = $state<Record<string, string>>({});
	let isLoading = $state(false);

	$effect(() => {
		if (!open) {
			error = undefined;
			fieldErrors = {};
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="gap-0 p-0 sm:max-w-lg">
		<Dialog.Header class="border-b px-5 py-3.5">
			<Dialog.Title class="text-base font-semibold">Adicionar Veículo</Dialog.Title>
			<Dialog.Description class="text-sm text-muted-foreground">
				Cadastre um novo veículo na sua frota.
			</Dialog.Description>
		</Dialog.Header>

		<form
			{...createVehicle.enhance(async ({ submit }) => {
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
			<input type="hidden" name="organizationSlug" value={page.params.organization_slug} />

			<div class="space-y-3.5 px-5 py-4">
				{#if error}
					<Alert.Root variant="destructive" class="py-2.5">
						<CircleAlertIcon class="size-4" />
						<Alert.Description class="text-sm">{error}</Alert.Description>
					</Alert.Root>
				{/if}

				<div class="grid gap-3.5 sm:grid-cols-2">
					<Field.Field class="gap-1.5">
						<Field.Label for="name" class="text-sm font-medium">
							Nome <span class="text-destructive">*</span>
						</Field.Label>
						<input
							id="name"
							name="name"
							type="text"
							placeholder="Meu Caminhão"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring {fieldErrors.name ? 'border-destructive' : ''}"
						/>
						{#if fieldErrors.name}
							<Field.Error>{fieldErrors.name}</Field.Error>
						{/if}
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="nickname" class="text-sm font-medium">Apelido</Field.Label>
						<input
							id="nickname"
							name="nickname"
							type="text"
							placeholder="Grandão"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="brand" class="text-sm font-medium">Marca</Field.Label>
						<input
							id="brand"
							name="brand"
							type="text"
							placeholder="Toyota"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="model" class="text-sm font-medium">Modelo</Field.Label>
						<input
							id="model"
							name="model"
							type="text"
							placeholder="Hilux"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="year" class="text-sm font-medium">Ano</Field.Label>
						<input
							id="year"
							name="year"
							type="number"
							placeholder="2024"
							min="1900"
							max="2100"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="plate" class="text-sm font-medium">Placa</Field.Label>
						<input
							id="plate"
							name="plate"
							type="text"
							placeholder="ABC-1234"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="currentKm" class="text-sm font-medium">KM Atual</Field.Label>
						<input
							id="currentKm"
							name="currentKm"
							type="number"
							placeholder="0"
							min="0"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="fuelType" class="text-sm font-medium">Combustível</Field.Label>
						<input
							id="fuelType"
							name="fuelType"
							type="text"
							placeholder="Diesel"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</Field.Field>

					<Field.Field class="col-span-2 gap-1.5">
						<Field.Label for="engine" class="text-sm font-medium">Motor</Field.Label>
						<input
							id="engine"
							name="engine"
							type="text"
							placeholder="2.8 Turbo Diesel"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</Field.Field>

					<Field.Field class="col-span-2 gap-1.5">
						<Field.Label for="notes" class="text-sm font-medium">Observações</Field.Label>
						<textarea
							id="notes"
							name="notes"
							rows={2}
							placeholder="Informações adicionais..."
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
						Adicionando...
					{:else}
						Adicionar veículo
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
