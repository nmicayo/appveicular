<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();

	const slug = $derived(page.params.organization_slug!);
	const isRelatorios = $derived(page.url.pathname.endsWith('/relatorios'));
</script>

<div class="flex h-full flex-1 flex-col overflow-hidden">
	<!-- Tab nav -->
	<div class="hidden shrink-0 border-b px-8 md:flex">
		<a
			href="/{slug}/dashboard"
			class="relative px-4 py-3 text-sm font-medium transition-colors
				{!isRelatorios
				? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			Visão Geral
		</a>
		<a
			href="/{slug}/dashboard/relatorios"
			class="relative px-4 py-3 text-sm font-medium transition-colors
				{isRelatorios
				? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			Relatórios
		</a>
	</div>

	<!-- Page content -->
	<div class="flex flex-1 flex-col overflow-auto">
		{@render children()}
	</div>
</div>
