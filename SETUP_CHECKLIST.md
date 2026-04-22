# ✅ Setup Checklist - Novo Projeto

Use este checklist toda vez que criar um novo projeto a partir deste template.

## 📋 Passos Iniciais

### 1. Clonar e Preparar
- [ ] Clonar repositório: `git clone [URL] meu-projeto`
- [ ] Entrar na pasta: `cd meu-projeto`
- [ ] Remover git antigo: `rm -rf .git`
- [ ] Inicializar novo repo: `git init`
- [ ] Atualizar `package.json` → trocar `"name"` para o nome do projeto

### 2. Instalar Dependências
- [ ] Executar: `bun install`
- [ ] Verificar se não há erros

### 3. Configurar Ambiente
- [ ] Executar setup interativo: `bun run setup`
  - [ ] Gerar secret key
  - [ ] Criar `.env`
  - [ ] Iniciar Docker (quando solicitado)
  - [ ] Rodar migrations (quando solicitado)

### 4. Verificar Database
- [ ] Container rodando: `docker ps | grep postgres`
- [ ] Conectar ao banco: `bun run db:console`
- [ ] Verificar tabelas: `\dt` (dentro do psql)
- [ ] Sair: `\q`

### 5. Iniciar Desenvolvimento
- [ ] Iniciar servidor: `bun run dev`
- [ ] Acessar: http://localhost:5173
- [ ] Verificar se carrega sem erros no console

### 6. Primeiro Commit
```bash
git add .
git commit -m "Initial commit from template"
git branch -M main
git remote add origin [SEU-REPOSITORIO]
git push -u origin main
```

---

## 🔍 Checklist de Verificação

Depois do setup, confirme:

- [ ] ✅ `.env` existe e tem as variáveis corretas
- [ ] ✅ Docker container PostgreSQL está rodando
- [ ] ✅ Migrações foram aplicadas (8 tabelas criadas)
- [ ] ✅ Tipos TypeScript gerados em `src/lib/server/db/db.types.ts`
- [ ] ✅ Servidor dev inicia sem erros
- [ ] ✅ Página inicial carrega no browser

---

## 🚨 Se algo der errado

### Database não conecta
```bash
# Ver status do container
docker ps -a

# Ver logs
bun run db:logs

# Reiniciar
bun run db:restart

# Reset completo (⚠️ apaga dados)
bun run db:reset
```

### Erros de tipo/migração
```bash
# Regenerar tipos
bun run gentypes

# Ver status das migrations
bun run db:migrate:status

# Reaplicar migrations
bun run db:migrate
```

### Erro "Bun is not defined" ou "kysely-bun-sql"
```bash
# Verificar se pg está instalado
bun pm ls | grep pg

# Reinstalar se necessário
bun add pg @types/pg
```

### Porta ocupada
```bash
# Verificar o que está usando a porta
lsof -i :5432
lsof -i :5433

# Parar PostgreSQL local se necessário
brew services stop postgresql@14  # macOS
```

---

## 🎯 Próximos Passos

Depois do setup inicial:

1. **Customizar Schema**
   - [ ] Planejar as tabelas necessárias
   - [ ] Criar migrations: `bun run db:migrate:diff`
   - [ ] Aplicar: `bun run db:setup`

2. **Configurar Auth**
   - [ ] Adicionar provedores OAuth se necessário
   - [ ] Customizar `src/lib/server/auth.ts`
   - [ ] Criar páginas de login/registro

3. **Desenvolver Features**
   - [ ] Criar rotas em `src/routes/`
   - [ ] Adicionar componentes em `src/lib/components/`
   - [ ] Implementar queries Kysely

4. **Deploy**
   - [ ] Configurar CI/CD
   - [ ] Escolher plataforma (Vercel, Railway, etc)
   - [ ] Configurar banco de produção
   - [ ] Configurar variáveis de ambiente

---

## 📝 Notas Importantes

- **Sempre** rode `bun run gentypes` após mudanças no schema
- **Nunca** commite o arquivo `.env` (já está no `.gitignore`)
- **Use** `bun run db:reset` com cuidado (apaga todos os dados)
- **Porta 5433** é para evitar conflito com PostgreSQL local

---

## 🆘 Precisa de Ajuda?

Consulte o [README.md](README.md) para documentação completa.

Problemas comuns estão na seção **Troubleshooting**.
