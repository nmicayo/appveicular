<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	const slug = page.params.organization_slug!;

	$effect(() => {
		goto(`/${slug}/dashboard/relatorios`, { replaceState: true });
	});
</script>
