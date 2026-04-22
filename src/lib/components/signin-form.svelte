<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { signin } from '$lib/remote/auth.remote';
	import { isHttpError } from '@sveltejs/kit';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import * as Alert from '$lib/components/ui/alert/index.js';

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();

	let loginError = $state<string | undefined>();
	let isLoading = $state(false);
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
	<Card.Root>
		<Card.Header class="text-center">
			<Card.Title class="text-xl">Bem-vindo de volta</Card.Title>
		</Card.Header>
		<Card.Content>
			<form
				{...signin.enhance(async ({ submit }) => {
					loginError = undefined;
					isLoading = true;
					try {
						await submit();
					} catch (error) {
						if (isHttpError(error)) {
							loginError = error.body.message;
						} else {
							loginError = 'Ocorreu um erro inesperado. Tente novamente.';
						}
					} finally {
						isLoading = false;
					}
				})}
			>
				<div class="grid gap-6">
					<div class="grid gap-6">
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
							<Input id="password" name="password" type="password" required disabled={isLoading} />
						</div>
						{#if loginError}
							<Alert.Root variant="destructive">
								<CircleAlertIcon class="size-4" />
								<Alert.Title>Erro</Alert.Title>
								<Alert.Description>{loginError}</Alert.Description>
							</Alert.Root>
						{/if}
						<Button type="submit" class="w-full" disabled={isLoading}>
							{isLoading ? 'Entrando...' : 'Entrar'}
						</Button>
					</div>
					<div class="text-center text-sm">
						Não tem uma conta?
						<a href="/sign-up" class="underline underline-offset-4"> Cadastrar-se </a>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
