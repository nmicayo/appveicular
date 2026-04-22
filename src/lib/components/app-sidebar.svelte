<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DashboardIcon from '@tabler/icons-svelte/icons/dashboard';
	import CarIcon from '@tabler/icons-svelte/icons/car';
	import ToolIcon from '@tabler/icons-svelte/icons/tool';
	import CalendarIcon from '@tabler/icons-svelte/icons/calendar';
	import BellIcon from '@tabler/icons-svelte/icons/bell';
	import SettingsIcon from '@tabler/icons-svelte/icons/settings';
	import type { User } from 'better-auth';
	import type { ComponentProps } from 'svelte';
	import NavMain from './nav-main.svelte';
	import NavUser from './nav-user.svelte';
	import OrgSwitcher from './org-switcher.svelte';
	import CreateOrganizationDialog from './create-organization-dialog.svelte';
	import CommandPalette from './command-palette.svelte';
	import SearchIcon2 from '@lucide/svelte/icons/search';
	import * as Kbd from '$lib/components/ui/kbd/index.js';
	import { useIsMac } from '$lib/hooks/use-is-mac.svelte.js';
	import { page } from '$app/state';
	import { listOrganizations } from '$lib/remote/organization.remote';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	type Props = ComponentProps<typeof Sidebar.Root> & {
		user: User;
	};

	let { user, ...restProps }: Props = $props();

	// Use remote function for organization list
	const organizations = $derived(await listOrganizations());

	// Get active organization from URL slug
	const activeOrganization = $derived(
		organizations.find((org) => org.slug === page.params.organization_slug) ?? null
	);

	// Dialog state
	let showCreateOrgDialog = $state(false);
	let showCommandPalette = $state(false);

	// Platform detection for keyboard shortcuts
	const isMac = useIsMac();

	// Handle keyboard shortcut to open command palette
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			showCommandPalette = true;
		}
	}

	// If there are no organizations from the server, prompt creation dialog
	// Only show after the query has finished loading
	$effect(() => {
		if (organizations.length === 0) {
    		goto(resolve("/create-organization"))
		}
	});

	const data = {
		navMain: [
			{
				title: 'Painel',
				url: '/dashboard',
				icon: DashboardIcon
			},
			{
				title: 'Veículos',
				url: '/vehicles',
				icon: CarIcon
			},
			{
				title: 'Registros',
				url: '/records',
				icon: ToolIcon
			},
			{
				title: 'Planos',
				url: '/plans',
				icon: CalendarIcon
			},
			{
				title: 'Alertas',
				url: '/alerts',
				icon: BellIcon
			},
			{
				title: 'Configurações',
				url: '/settings',
				icon: SettingsIcon
			}
		]
	};
</script>

<svelte:document onkeydown={handleKeydown} />

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		{#if organizations.length === 0}
			<div class="px-2 py-1.5 text-sm text-muted-foreground">No organizations yet</div>
		{:else}
			{#key organizations.length + '-' + (activeOrganization?.id ?? 'none')}
				<OrgSwitcher orgs={organizations} {activeOrganization} />
			{/key}
		{/if}
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent class="px-2">
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContent="Search (${isMac ? '⌘' : 'Ctrl+'}K)"
							onclick={() => (showCommandPalette = true)}
							class="relative bg-muted/50 text-muted-foreground shadow-sm ring-1 ring-neutral-200/50 hover:bg-muted hover:text-foreground dark:ring-neutral-700/50"
						>
							<SearchIcon2 class="size-4" />
							<span class="flex-1 text-left">Search...</span>
							<div class="ml-auto flex gap-0.5">
								<Kbd.Root>{isMac ? '⌘' : 'Ctrl'}</Kbd.Root>
								<Kbd.Root>K</Kbd.Root>
							</div>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
		<NavMain items={data.navMain} />
		<!-- <NavSecondary items={data.navSecondary} class="mt-auto" /> -->
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser {user} />
	</Sidebar.Footer>
</Sidebar.Root>

<CreateOrganizationDialog bind:open={showCreateOrgDialog} />
<CommandPalette
	bind:open={showCommandPalette}
	{organizations}
	{activeOrganization}
	isAuthenticated={true}
/>
