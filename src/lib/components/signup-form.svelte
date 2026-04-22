<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { signup } from '$lib/remote/auth.remote';
	import { isHttpError } from '@sveltejs/kit';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import * as Alert from '$lib/components/ui/alert/index.js';

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();

	let signUpError = $state<string | undefined>();
	let isLoading = $state(false);
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
	<Card.Root>
		<Card.Header class="text-center">
			<Card.Title class="text-xl">Criar sua conta</Card.Title>
		</Card.Header>
		<Card.Content>
			<form
				{...signup.enhance(async ({ submit }) => {
					signUpError = undefined;
					isLoading = true;
					try {
						await submit();
					} catch (error) {
						if (isHttpError(error)) {
							signUpError = error.body.message;
						} else {
							signUpError = 'Ocorreu um erro inesperado. Tente novamente.';
						}
					} finally {
						isLoading = false;
					}
				})}
			>
				<div class="grid gap-6">
					<div class="grid gap-6">
						<div class="space-y-2">
							<label for="name" class="text-sm font-medium">Nome completo</label>
							<Input
								id="name"
								name="name"
								type="text"
								placeholder="João Silva"
								required
								disabled={isLoading}
							/>
						</div>
						<div class="space-y-2">
							<label for="email" class="text-sm font-medium">E-mail</label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="seu@email.com"
								required
								disabled={isLoading}
							/>
						</div>
						<div class="space-y-2">
							<label for="password" class="text-sm font-medium">Senha</label>
							<Input
								id="password"
								name="password"
								type="password"
								placeholder="Digite sua senha"
								required
								minlength={8}
								disabled={isLoading}
							/>
						</div>
						{#if signUpError}
							<Alert.Root variant="destructive">
								<CircleAlertIcon class="size-4" />
								<Alert.Title>Erro</Alert.Title>
								<Alert.Description>{signUpError}</Alert.Description>
							</Alert.Root>
						{/if}
						<Button type="submit" class="w-full" disabled={isLoading}>
							{isLoading ? 'Criando conta...' : 'Criar conta'}
						</Button>
					</div>
					<div class="text-center text-sm">
						Já tem uma conta?
						<a href="/sign-in" class="underline underline-offset-4"> Entrar </a>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
