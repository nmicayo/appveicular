<script lang="ts">
	import SettingsIcon from '@tabler/icons-svelte/icons/settings';
</script>

<div class="hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
	<div class="flex flex-col gap-1">
		<h2 class="text-2xl font-semibold tracking-tight">Configurações</h2>
		<p class="text-muted-foreground">Configurações da frota e do aplicativo.</p>
	</div>

	<div class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card py-16">
		<SettingsIcon class="size-12 text-muted-foreground/50" />
		<div class="text-center">
			<p class="font-medium">Configurações em breve</p>
			<p class="text-sm text-muted-foreground">
				As opções de configuração para o gerenciamento da sua frota aparecerão aqui.
			</p>
		</div>
	</div>
</div>
