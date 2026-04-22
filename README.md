# SvelteKit 5 + Better Auth + Kysely Template

Um template moderno de full-stack web application com **SvelteKit 5**, **Better Auth** e **Kysely** (PostgreSQL).

## 🚀 Quick Start - Criar Novo Projeto

### 1. Clonar o Template

```bash
# Clonar do GitHub
git clone https://github.com/jonathantx/forge-stack.git my-app
cd my-app

# Remover o git antigo e inicializar novo
rm -rf .git
git init
```

### 2. Instalar Dependências

```bash
bun install
```

### 3. Configurar o Projeto

```bash
bun run setup
```

Este comando interativo vai:
- ✅ Gerar uma chave secreta para autenticação
- ✅ Criar o arquivo `.env` automaticamente
- ✅ Iniciar PostgreSQL com Docker (se você quiser)
- ✅ Executar as migrações do banco de dados
- ✅ Gerar os tipos TypeScript do banco

### 4. Iniciar o Servidor

```bash
bun run dev
```

Acesse [http://localhost:5173](http://localhost:5173) 🎉

---

## 📋 Requisitos

- **Bun** v1.0+ ([instalar](https://bun.sh))
- **Docker** ([instalar](https://www.docker.com/get-started))
- **Docker Compose** (já vem com Docker Desktop)

---

## 🛠️ Comandos Disponíveis

### Desenvolvimento

```bash
bun run dev          # Inicia servidor de desenvolvimento
bun run build        # Build de produção
bun run preview      # Preview do build de produção
bun run check        # Type checking
bun run lint         # ESLint + Prettier
bun run format       # Formatar código
```

### Setup

```bash
bun run setup        # Configuração inicial interativa
```

### Banco de Dados

```bash
# Gerenciamento do Container
bun run db:start     # Inicia PostgreSQL (detached mode)
bun run db:stop      # Para o container
bun run db:restart   # Reinicia o container
bun run db:reset     # Reinicia do zero (⚠️ apaga todos os dados!)
bun run db:logs      # Ver logs do PostgreSQL
bun run db:console   # Abrir psql no container

# Migrações
bun run db:migrate           # Aplica migrações pendentes
bun run db:migrate:status    # Status das migrações
bun run db:migrate:diff      # Gera nova migração
bun run gentypes             # Gera tipos TypeScript do schema
bun run db:setup             # Migra + gera tipos (tudo de uma vez)

# Seed
bun run db:seed              # Popula banco com dados de exemplo
```

---

## 📁 Estrutura do Projeto

```
.
├── src/
│   ├── lib/
│   │   ├── components/           # Componentes Svelte
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── index.ts      # Conexão Kysely
│   │   │   │   └── db.types.ts   # Tipos gerados do DB
│   │   │   └── auth.ts           # Configuração Better Auth
│   │   └── ...
│   ├── routes/                   # Rotas SvelteKit
│   └── app.html
├── migrations/                   # Migrações do Atlas
├── scripts/
│   ├── setup-project.ts          # Script de setup
│   ├── apply-migration.sh        # Aplicar migrações
│   └── generate-migration.sh     # Gerar migrações
├── docker-compose.yml            # PostgreSQL
├── .env.example                  # Exemplo de variáveis de ambiente
└── package.json
```

---

## 🔧 Configuração Manual (Alternativa)

Se preferir configurar manualmente em vez de usar `bun run setup`:

### 1. Criar arquivo .env

```bash
cp .env.example .env
```

### 2. Gerar secret key

```bash
openssl rand -base64 32
```

Cole o resultado em `BETTER_AUTH_SECRET` no `.env`

### 3. Iniciar PostgreSQL

```bash
bun run db:start
```

### 4. Executar migrações

```bash
bun run db:setup
```

---

## 🐳 Informações do Docker

O `docker-compose.yml` cria um container PostgreSQL com:

- **Imagem**: PostgreSQL 17
- **Porta**: 5433 (para evitar conflito com PostgreSQL local na 5432)
- **Usuário**: postgres
- **Senha**: mysecretpassword
- **Banco**: local
- **Volume**: dados persistentes em `pgdata`

### Por que porta 5433?

Muitos desenvolvedores têm PostgreSQL instalado localmente na porta padrão 5432. Para evitar conflitos, este template usa 5433 por padrão.

Se quiser usar 5432, edite:
1. `docker-compose.yml` → linha `ports: - 5432:5432`
2. `.env` → `DATABASE_URL` → trocar `5433` por `5432`

---

## 🗄️ Database Migrations

Este template usa [Atlas](https://atlasgo.io/) para migrações.

### Criar uma nova migração

```bash
bun run db:migrate:diff
```

O Atlas vai:
1. Comparar o schema atual do banco com os arquivos de migração
2. Gerar automaticamente a SQL necessária
3. Criar um novo arquivo em `migrations/`

### Aplicar migrações

```bash
bun run db:migrate
```

### Verificar status

```bash
bun run db:migrate:status
```

### Depois de qualquer mudança no schema

**SEMPRE** regenere os tipos TypeScript:

```bash
bun run gentypes
```

Ou use o atalho que faz tudo:

```bash
bun run db:setup
```

---

## 🔐 Autenticação

Better Auth está pré-configurado com:

- ✅ Email/password authentication
- ✅ Suporte a organizações (multi-tenant)
- ✅ Gerenciamento de sessões
- ✅ Convites para organizações

Configuração em: [src/lib/server/auth.ts](src/lib/server/auth.ts)

---

## 🎨 Tech Stack

| Categoria | Tecnologia |
|-----------|-----------|
| **Runtime** | Bun |
| **Framework** | SvelteKit 5 |
| **Database** | PostgreSQL 17 |
| **Query Builder** | Kysely |
| **Migrations** | Atlas |
| **Auth** | Better Auth |
| **UI** | shadcn/ui (Svelte) + TailwindCSS v4 |
| **Type Safety** | TypeScript + Valibot |
| **Container** | Docker Compose |

---

## 📝 Workflows Comuns

### Começar um novo projeto

```bash
git clone [template-url] meu-projeto
cd meu-projeto
rm -rf .git && git init
bun install
bun run setup
bun run dev
```

### Adicionar uma nova tabela

```bash
# 1. Criar a migration
bun run db:migrate:diff

# 2. Editar o arquivo gerado em migrations/
# 3. Aplicar a migration
bun run db:migrate

# 4. Gerar tipos
bun run gentypes

# 5. Usar no código com type-safety completo!
```

### Reset completo do banco

```bash
bun run db:reset
```

Isso vai:
1. Parar e remover o container
2. Deletar o volume (⚠️ todos os dados!)
3. Criar novo container
4. Aplicar todas as migrações
5. Gerar tipos TypeScript

---

## 🐛 Troubleshooting

### Erro: "role postgres does not exist"

Você pode ter PostgreSQL rodando localmente. Verifique:

```bash
lsof -i :5432
```

**Solução 1**: Pare o PostgreSQL local
```bash
brew services stop postgresql@14  # macOS
sudo systemctl stop postgresql    # Linux
```

**Solução 2**: Use a porta 5433 (já configurada no template)

### Erro: "kysely-bun-sql" ou "Bun is not defined"

Este template já usa o driver `pg` correto. Se você vê este erro:

1. Verifique se tem `"pg": "^8.16.3"` no `package.json`
2. Confirme que `src/lib/server/db/index.ts` usa `PostgresDialect` e `Pool` do `pg`

### Erro: "DATABASE_URL" com valores antigos

Se você tem `DATABASE_URL` exportada no seu shell:

```bash
# Verificar
env | grep DATABASE_URL

# Remover temporariamente
unset DATABASE_URL
```

Ou adicione no seu `~/.zshrc` / `~/.bashrc`:
```bash
unset DATABASE_URL
```

### Container não inicia

```bash
# Ver logs
bun run db:logs

# Reiniciar
bun run db:restart

# Reset completo
bun run db:reset
```

---

## 📚 Recursos

- [SvelteKit Documentation](https://kit.svelte.dev)
- [Kysely Documentation](https://kysely.dev)
- [Better Auth Documentation](https://www.better-auth.com)
- [Atlas Documentation](https://atlasgo.io)
- [Bun Documentation](https://bun.sh)

---

## 📄 License

MIT

---

## 🎯 Próximos Passos

Depois de configurar o projeto:

1. [ ] Personalize o esquema do banco em `migrations/`
2. [ ] Configure autenticação adicional (OAuth, etc)
3. [ ] Adicione suas rotas em `src/routes/`
4. [ ] Customize os componentes UI
5. [ ] Configure deploy (Vercel, Railway, etc)

---

**Happy coding! 🚀**
