<script lang="ts">
	import BellIcon from '@tabler/icons-svelte/icons/bell';
</script>

<div class="hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
	<div class="flex flex-col gap-1">
		<h2 class="text-2xl font-semibold tracking-tight">Alertas</h2>
		<p class="text-muted-foreground">Alertas e notificações de manutenção.</p>
	</div>

	<div class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card py-16">
		<BellIcon class="size-12 text-muted-foreground/50" />
		<div class="text-center">
			<p class="font-medium">Alertas em breve</p>
			<p class="text-sm text-muted-foreground">
				Os alertas são gerados automaticamente a partir dos seus planos de manutenção.
			</p>
		</div>
	</div>
</div>
