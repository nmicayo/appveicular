import {
	LayoutDashboard,
	User,
	Building,
	RefreshCw,
	LogOut,
	Keyboard,
	ArrowLeft,
	Plus,
	Calendar,
	Users,
	Settings,
	GalleryVerticalEndIcon,
	AudioWaveformIcon,
	CommandIcon,
	Car,
	Wrench,
	ClipboardList,
	Bell,
	DollarSign
} from '@lucide/svelte';
import { navigateToInActiveOrg, changeActiveOrg } from '@/client.utils.svelte';
import { goto } from '$app/navigation';

// Type definitions
export type CommandCategory = 'navigation' | 'action' | 'organization' | 'page-specific' | 'filter';

export type CommandVisibility = {
	routes?: string[];
	excludeRoutes?: string[];
	routePatterns?: RegExp[];
	requiresAuth?: boolean;
	requiresOrg?: boolean;
	custom?: (context: CommandContext) => boolean;
};

export type CommandItem = {
	id: string;
	label: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: any;
	shortcut?: string;
	action: () => void | Promise<void>;
	keywords?: string[];
	category: CommandCategory;
	disabled?: boolean;
	badge?: string;
	closeOnExecute?: boolean;
	visibility?: CommandVisibility;
	priority?: number;
};

export type CommandContext = {
	pathname: string;
	params: Record<string, string>;
	searchParams: URLSearchParams;
	isAuthenticated: boolean;
	activeOrganization?: { id: string; slug?: string | null } | null;
	organizations?: Array<{
		id: string;
		name: string;
		slug?: string | null;
		logo?: string | null;
		metadata?: Record<string, unknown> | null;
	}>;
	isMac?: boolean;
};

function isOnRoute(pathname: string, route: string): boolean {
	if (route.includes('[organization_slug]')) {
		const routeWithoutOrg = route.replace('/[organization_slug]', '');
		const pathSegments = pathname.split('/').filter(Boolean);
		if (pathSegments.length > 0) {
			const pathWithoutOrg = '/' + pathSegments.slice(1).join('/');
			return pathWithoutOrg === routeWithoutOrg;
		}
	}
	return pathname === route;
}

function matchesRoutePattern(pathname: string, pattern: RegExp): boolean {
	return pattern.test(pathname);
}

function checkVisibility(command: CommandItem, context: CommandContext): boolean {
	if (!command.visibility) return true;

	const vis = command.visibility;

	if (vis.requiresAuth !== undefined && vis.requiresAuth !== context.isAuthenticated) {
		return false;
	}

	if (vis.requiresOrg && !context.activeOrganization) {
		return false;
	}

	if (vis.routes && vis.routes.length > 0) {
		const matchesRoute = vis.routes.some((route) => isOnRoute(context.pathname, route));
		if (!matchesRoute) return false;
	}

	if (vis.excludeRoutes && vis.excludeRoutes.length > 0) {
		const isExcluded = vis.excludeRoutes.some((route) => isOnRoute(context.pathname, route));
		if (isExcluded) return false;
	}

	if (vis.routePatterns && vis.routePatterns.length > 0) {
		const matchesPattern = vis.routePatterns.some((pattern) =>
			matchesRoutePattern(context.pathname, pattern)
		);
		if (!matchesPattern) return false;
	}

	if (vis.custom && !vis.custom(context)) {
		return false;
	}

	return true;
}

export function getNavigationCommands(context: CommandContext): CommandItem[] {
	const modKey = context.isMac ? '⌘' : 'Ctrl+';

	return [
		{
			id: 'nav-dashboard',
			label: 'Painel',
			icon: LayoutDashboard,
			shortcut: `${modKey}D`,
			action: () => navigateToInActiveOrg('/dashboard'),
			keywords: ['painel', 'inicio', 'resumo', 'frota'],
			category: 'navigation',
			priority: 1
		},
		{
			id: 'nav-vehicles',
			label: 'Veículos',
			icon: Car,
			action: () => navigateToInActiveOrg('/vehicles'),
			keywords: ['veiculos', 'frota', 'carro', 'caminhao'],
			category: 'navigation',
			priority: 2
		},
		{
			id: 'nav-records',
			label: 'Registros de Manutenção',
			icon: Wrench,
			action: () => navigateToInActiveOrg('/records'),
			keywords: ['registros', 'manutencao', 'historico', 'servico'],
			category: 'navigation',
			priority: 3
		},
		{
			id: 'nav-plans',
			label: 'Planos de Manutenção',
			icon: ClipboardList,
			action: () => navigateToInActiveOrg('/plans'),
			keywords: ['planos', 'agendamento', 'preventivo'],
			category: 'navigation',
			priority: 4
		},
		{
			id: 'nav-alerts',
			label: 'Alertas',
			icon: Bell,
			action: () => navigateToInActiveOrg('/alerts'),
			keywords: ['alertas', 'notificacoes', 'avisos'],
			category: 'navigation',
			priority: 5
		},
		{
			id: 'nav-costs',
			label: 'Custos',
			icon: DollarSign,
			action: () => navigateToInActiveOrg('/costs'),
			keywords: ['custos', 'financeiro', 'despesas'],
			category: 'navigation',
			priority: 6
		},
		{
			id: 'nav-account',
			label: 'Conta',
			icon: User,
			shortcut: `${modKey}U`,
			action: () => navigateToInActiveOrg('/account'),
			keywords: ['conta', 'perfil', 'usuario'],
			category: 'navigation',
			priority: 7
		},
		{
			id: 'nav-organization',
			label: 'Organização',
			icon: Building,
			action: () => navigateToInActiveOrg('/organization/settings'),
			keywords: ['organizacao', 'empresa', 'equipe'],
			category: 'navigation',
			priority: 8,
			visibility: {
				requiresOrg: true
			}
		}
	];
}

export function getQuickActions(context: CommandContext): CommandItem[] {
	const modKey = context.isMac ? '⌘' : 'Ctrl+';

	return [
		{
			id: 'action-refresh',
			label: 'Atualizar página',
			icon: RefreshCw,
			shortcut: `${modKey}R`,
			action: () => window.location.reload(),
			keywords: ['atualizar', 'recarregar'],
			category: 'action',
			priority: 10
		},
		{
			id: 'action-change-organization',
			label: 'Trocar organização',
			icon: Building,
			action: () => {
				return Promise.resolve();
			},
			keywords: ['trocar', 'organização', 'empresa'],
			category: 'action',
			closeOnExecute: false,
			priority: 11,
			visibility: {
				requiresAuth: true,
				custom: (ctx) => (ctx.organizations?.length ?? 0) > 1
			}
		},
		{
			id: 'action-shortcuts',
			label: 'Atalhos de teclado',
			icon: Keyboard,
			shortcut: '?',
			action: () => {
				return Promise.resolve();
			},
			keywords: ['atalhos', 'teclado', 'ajuda'],
			category: 'action',
			priority: 12
		},
		{
			id: 'action-signout',
			label: 'Sair',
			icon: LogOut,
			action: async () => {
				try {
					const response = await fetch('/api/auth/sign-out', { method: 'POST' });
					if (response.ok) {
						goto('/sign-in');
					}
				} catch (error) {
					console.error('Failed to sign out:', error);
				}
			},
			keywords: ['sair', 'logout', 'desconectar'],
			category: 'action',
			priority: 20,
			visibility: {
				requiresAuth: true
			}
		}
	];
}

export function getDashboardCommands(context: CommandContext): CommandItem[] {
	const isOnDashboard = isOnRoute(context.pathname, '/[organization_slug]/dashboard');
	if (!isOnDashboard) return [];

	return [
		{
			id: 'dashboard-add-vehicle',
			label: 'Adicionar veículo',
			icon: Car,
			action: () => navigateToInActiveOrg('/vehicles'),
			keywords: ['adicionar', 'veiculo', 'novo'],
			category: 'page-specific',
			priority: 1,
			visibility: {
				routes: ['/[organization_slug]/dashboard']
			}
		}
	];
}

export function getOrganizationCommands(context: CommandContext): CommandItem[] {
	if (!context.organizations || context.organizations.length === 0) return [];

	const fallbackOrgIcons = [GalleryVerticalEndIcon, AudioWaveformIcon, CommandIcon];

	return context.organizations.flatMap((org, index) => {
		if (!org.slug) return [];
		const isActive = context.activeOrganization?.id === org.id;
		const Icon = fallbackOrgIcons[index % fallbackOrgIcons.length] ?? Building;

		return [
			{
				id: `org-${org.id}`,
				label: org.name,
				icon: Icon,
				action: () => changeActiveOrg(org.slug!),
				keywords: [org.slug, org.name],
				category: 'organization',
				badge: isActive ? 'Ativa' : undefined,
				disabled: isActive,
				priority: index
			}
		];
	});
}

export function getOrganizationSettingsCommands(context: CommandContext): CommandItem[] {
	const isOnOrgSettings = matchesRoutePattern(
		context.pathname,
		/\/organization\/[^/]+\/organization/
	);
	if (!isOnOrgSettings) return [];

	return [
		{
			id: 'org-invite-member',
			label: 'Convidar membro',
			icon: Users,
			action: () => {
				const event = new CustomEvent('command:inviteMember');
				window.dispatchEvent(event);
			},
			keywords: ['convidar', 'membro', 'usuario', 'equipe'],
			category: 'page-specific',
			priority: 1,
			visibility: {
				routePatterns: [/\/organization\/[^/]+\/organization/]
			}
		},
		{
			id: 'org-settings',
			label: 'Configurações da organização',
			icon: Settings,
			action: () => navigateToInActiveOrg('/organization/settings'),
			keywords: ['configuracoes', 'organizacao'],
			category: 'page-specific',
			priority: 2,
			visibility: {
				routePatterns: [/\/organization\/[^/]+\/organization/]
			}
		}
	];
}

export function getAllCommands(context: CommandContext): CommandItem[] {
	const commands = [
		...getNavigationCommands(context),
		...getQuickActions(context),
		...getDashboardCommands(context),
		...getOrganizationCommands(context),
		...getOrganizationSettingsCommands(context)
	];

	return commands.sort((a, b) => {
		const categoryOrder = ['navigation', 'page-specific', 'action', 'organization', 'filter'];
		const aCategoryIndex = categoryOrder.indexOf(a.category);
		const bCategoryIndex = categoryOrder.indexOf(b.category);

		if (aCategoryIndex !== bCategoryIndex) {
			return aCategoryIndex - bCategoryIndex;
		}

		return (a.priority ?? 999) - (b.priority ?? 999);
	});
}

export function getVisibleCommands(context: CommandContext): CommandItem[] {
	const allCommands = getAllCommands(context);
	return allCommands.filter((command) => checkVisibility(command, context));
}

export function getCommandsByCategory(
	category: CommandCategory,
	context: CommandContext
): CommandItem[] {
	const visibleCommands = getVisibleCommands(context);
	return visibleCommands.filter((cmd) => cmd.category === category);
}

export function getOrganizationSwitchCommands(context: CommandContext): CommandItem[] {
	return [
		...getOrganizationCommands(context),
		{
			id: 'back-to-commands',
			label: 'Voltar para todos os comandos',
			icon: ArrowLeft,
			action: () => {
				return Promise.resolve();
			},
			keywords: ['voltar', 'retornar'],
			category: 'action',
			priority: 999
		}
	];
}
