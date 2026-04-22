<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import { defaultMaintenanceCategories } from '$lib/schemas/maintenance-record.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let {
		value = $bindable(''),
		existingCategories = [],
		name,
		placeholder = 'Selecionar categoria...'
	}: {
		value?: string;
		existingCategories?: { id: string; name: string }[];
		name: string;
		placeholder?: string;
	} = $props();

	let open = $state(false);
	let search = $state('');

	// Merge org categories + defaults, deduplicated case-insensitively, names only for display
	const allNames = $derived(() => {
		const seen = new Set<string>();
		const result: string[] = [];
		for (const c of existingCategories) {
			const key = c.name.toLowerCase();
			if (!seen.has(key)) {
				seen.add(key);
				result.push(c.name);
			}
		}
		for (const name of defaultMaintenanceCategories) {
			const key = name.toLowerCase();
			if (!seen.has(key)) {
				seen.add(key);
				result.push(name);
			}
		}
		return result.sort((a, b) => a.localeCompare(b, 'pt-BR'));
	});

	const filtered = $derived(() => {
		const q = search.toLowerCase();
		return q ? allNames().filter((n) => n.toLowerCase().includes(q)) : allNames();
	});

	// Show "create" only if search doesn't match any existing name (case-insensitive)
	const canCreate = $derived(() => {
		const q = search.trim();
		if (!q) return false;
		return !allNames().some((n) => n.toLowerCase() === q.toLowerCase());
	});

	function select(cat: string) {
		value = cat;
		search = '';
		open = false;
	}

	function create() {
		const q = search.trim();
		if (!q) return;
		select(q);
	}
</script>

<!-- The form receives the category name; the server resolves to category_id -->
<input type="hidden" {name} value={value ?? ''} />

<Popover.Root bind:open>
	<Popover.Trigger
		class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
	>
		<span class={value ? '' : 'text-muted-foreground'}>{value || placeholder}</span>
		<ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
	</Popover.Trigger>
	<Popover.Content class="w-[--radix-popover-trigger-width] p-0" align="start">
		<Command.Root shouldFilter={false}>
			<Command.Input
				bind:value={search}
				placeholder="Buscar ou criar categoria..."
				class="h-9"
			/>
			<Command.List>
				{#if filtered().length === 0 && !canCreate()}
					<Command.Empty>Nenhuma categoria encontrada.</Command.Empty>
				{/if}

				{#each filtered() as cat (cat)}
					<Command.Item value={cat} onSelect={() => select(cat)}>
						<CheckIcon class="mr-2 size-4 {value === cat ? 'opacity-100' : 'opacity-0'}" />
						{cat}
					</Command.Item>
				{/each}

				{#if canCreate()}
					<Command.Item value="__create__" onSelect={create}>
						<PlusIcon class="mr-2 size-4" />
						Criar "<span class="font-medium">{search.trim()}</span>"
					</Command.Item>
				{/if}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
