<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import CreateOrganizationForm from './create-organization-form.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<Dialog.Root {open}>
	<Dialog.Content class="gap-0 p-0 sm:max-w-md" showCloseButton={false}>
		<Dialog.Header class="border-b px-5 py-3.5">
			<Dialog.Title class="text-base font-semibold">Criar sua primeira organização</Dialog.Title>
			<Dialog.Description class="text-sm text-muted-foreground">
				Organizações ajudam você a gerenciar equipes e colaborar
			</Dialog.Description>
		</Dialog.Header>

		<CreateOrganizationForm />
	</Dialog.Content>
</Dialog.Root>
