<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { toast } from 'svelte-sonner';
	import UserIcon from '@tabler/icons-svelte/icons/user';
	import MailIcon from '@tabler/icons-svelte/icons/mail';
	import CalendarIcon from '@tabler/icons-svelte/icons/calendar';
	import ShieldIcon from '@tabler/icons-svelte/icons/shield';
	
	import { updateProfile } from '$lib/remote/profile.remote';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	let isEditing = $state(false);

	// Initialize form with current user name
	$effect(() => {
		if (!isEditing) {
			updateProfile.fields.name.set(data.user.name);
		}
	});

	// Generate initials from user name
	const initials = $derived(
		data.user.name
			.split(' ')
			.map((word) => word[0])
			.join('')
			.toUpperCase()
			.slice(0, 2)
	);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('pt-BR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	function handleCancel() {
		isEditing = false; // Effect will reset form to data.user.name
	}

	function startEdit() {
		isEditing = true;
	}

	function copy(text: string) {
		try {
			navigator.clipboard?.writeText(text);
			toast.success('Copiado para a área de transferência.');
		} catch {
			toast.error('Falha ao copiar.');
		}
	}
</script>

<svelte:head>
	<title>Conta - Configurações de Perfil</title>
</svelte:head>

<div class="@container/main hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
	<div class="flex items-center justify-between gap-3">
		<div class="flex flex-col gap-1">
			<h2 class="text-2xl font-semibold tracking-tight">Conta</h2>
			<p class="text-muted-foreground">Gerencie seu perfil e segurança.</p>
		</div>
		{#if !isEditing}
			<Button variant="outline" size="sm" onclick={startEdit} class="max-w-full truncate">
				<UserIcon class="mr-2 size-4 shrink-0" />
				<span class="truncate">Editar perfil</span>
			</Button>
		{/if}
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Left: Profile -->
		<Card class="gap-4 py-4 shadow-xs md:col-span-2">
			<CardHeader class="px-5 pb-0">
				<div class="flex items-center gap-4">
					<Avatar class="size-16 shrink-0 sm:size-20">
						<AvatarImage src={data.user.image} alt={data.user.name} />
						<AvatarFallback class="text-base sm:text-lg">{initials}</AvatarFallback>
					</Avatar>
					<div class="min-w-0 space-y-1">
						<CardTitle class="truncate text-lg font-semibold">{data.user.name}</CardTitle>
						<CardDescription class="truncate text-sm text-muted-foreground">{data.user.email}</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent class="space-y-4 px-5">
				<Separator />
				<div class="space-y-1">
					<h3 class="text-lg font-medium">Perfil</h3>
					<p class="text-sm text-muted-foreground">Informações básicas da sua conta.</p>
				</div>

				{#if isEditing}
					<form
						{...updateProfile.enhance(async ({ submit }) => {
							try {
								await submit();
								if (updateProfile.result?.success) {
									toast.success('Perfil atualizado com sucesso.');
									await invalidateAll();
									isEditing = false;
								}
							} catch {
								toast.error('Falha ao salvar perfil. Tente novamente.');
							}
						})}
						class="grid gap-4"
					>
						<div class="grid gap-2">
							<Label for="name">Nome completo</Label>
							<Input
								{...updateProfile.fields.name.as('text')}
								id="name"
								placeholder="Digite seu nome completo"
								disabled={!!updateProfile.pending}
							/>
							{#each updateProfile.fields.name.issues() ?? [] as issue (issue.message)}
								<p class="text-xs text-destructive">{issue.message}</p>
							{/each}
							<p class="text-xs text-muted-foreground">
								Use seu nome real para que as pessoas possam reconhecê-lo.
							</p>
						</div>

						<div class="grid gap-2">
							<Label for="email">Endereço de e-mail</Label>
							<div class="flex items-center space-x-2 py-1">
								<MailIcon class="size-4 shrink-0 text-muted-foreground" />
								<span class="truncate text-sm">{data.user.email}</span>
								<span class="text-xs whitespace-nowrap text-muted-foreground"
									>(E-mail não pode ser alterado)</span
								>
							</div>
						</div>

						<div class="flex flex-col gap-2 pt-2 sm:flex-row">
							<Button type="submit" disabled={!!updateProfile.pending}>
								{updateProfile.pending ? 'Salvando...' : 'Salvar alterações'}
							</Button>
							<Button type="button" variant="outline" onclick={handleCancel} disabled={!!updateProfile.pending}>
								Cancelar
							</Button>
						</div>
					</form>
				{:else}
					<div class="grid gap-4">
						<div class="grid gap-2">
							<Label for="name">Nome completo</Label>
							<div class="flex items-center space-x-2 py-1">
								<UserIcon class="size-4 shrink-0 text-muted-foreground" />
								<span class="truncate text-sm">{data.user.name}</span>
							</div>
						</div>

						<div class="grid gap-2">
							<Label for="email">Endereço de e-mail</Label>
							<div class="flex items-center space-x-2 py-1">
								<MailIcon class="size-4 shrink-0 text-muted-foreground" />
								<span class="truncate text-sm">{data.user.email}</span>
								<span class="text-xs whitespace-nowrap text-muted-foreground"
									>(E-mail não pode ser alterado)</span
								>
							</div>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Right: Meta -->
		<div class="space-y-6">
			<Card class="gap-4 py-4 shadow-xs">
				<CardHeader class="px-5 pb-0">
					<CardTitle>Conta</CardTitle>
					<CardDescription>Identificadores e status.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-2 px-5">
					<div class="flex items-center justify-between gap-3 py-1">
						<div class="flex min-w-0 items-center space-x-2">
							<CalendarIcon class="size-4 shrink-0 text-muted-foreground" />
							<span class="text-sm font-medium">Criado em</span>
						</div>
						<span class="truncate text-sm text-muted-foreground">
							{formatDate(data.user.createdAt.toString())}
						</span>
					</div>

					<div class="flex items-center justify-between gap-3 py-1">
						<div class="flex min-w-0 items-center space-x-2">
							<ShieldIcon class="size-4 shrink-0 text-muted-foreground" />
							<span class="text-sm font-medium">ID do usuário</span>
						</div>
						<div class="flex max-w-[65%] items-center gap-2">
							<span class="truncate font-mono text-xs text-muted-foreground">{data.user.id}</span>
							<Button
								size="sm"
								variant="outline"
								class="shrink-0"
								onclick={() => copy(data.user.id)}
							>
								Copiar
							</Button>
						</div>
					</div>

					<div class="flex items-center justify-between gap-3 py-1">
						<div class="flex min-w-0 items-center space-x-2">
							<MailIcon class="size-4 shrink-0 text-muted-foreground" />
							<span class="text-sm font-medium">E-mail verificado</span>
						</div>
						<span class="text-sm whitespace-nowrap">
							{#if data.user.emailVerified}
								<span class="font-medium text-green-600">✓ Verificado</span>
							{:else}
								<span class="font-medium text-orange-600">⚠ Não verificado</span>
							{/if}
						</span>
					</div>
				</CardContent>
			</Card>

			<Card class="gap-4 py-4 shadow-xs">
				<CardHeader class="px-5 pb-0">
					<CardTitle>Segurança</CardTitle>
					<CardDescription>Senha e proteção.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-3 px-5">
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<p class="text-sm font-medium">Senha</p>
							<p class="text-xs text-muted-foreground">
								Última atualização: {formatDate(data.user.updatedAt.toString())}
							</p>
						</div>
						<Button
							size="sm"
							variant="outline"
							onclick={() => window.alert('Funcionalidade de alteração de senha em breve!')}
						>
							Alterar senha
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card class="gap-4 py-4 shadow-xs border-destructive">
				<CardHeader class="px-5 pb-0">
					<CardTitle class="text-destructive">Zona de Perigo</CardTitle>
					<CardDescription>Ações irreversíveis e destrutivas.</CardDescription>
				</CardHeader>
				<CardContent class="px-5">
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<p class="text-sm font-medium">Excluir conta</p>
								<p class="text-xs text-muted-foreground">
									Exclui permanentemente sua conta e todos os dados associados.
								</p>
							</div>
							<Button
								size="sm"
								variant="destructive"
								onclick={() => {
									window.alert('Exclusão de conta ainda não implementada.');
								}}
							>
								Excluir conta
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
