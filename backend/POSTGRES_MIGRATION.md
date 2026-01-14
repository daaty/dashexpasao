# Migração para PostgreSQL - Easy Panel

## Passo 1: Executar SQL de Criação das Tabelas

No painel do Easy Panel, acesse o PostgreSQL e execute o arquivo `migration.sql` completo.

Ou execute este comando completo:

```sql
-- Ver arquivo migration.sql na raiz do backend
```

## Passo 2: Popular com Dados do IBGE

Após criar as tabelas, você tem 2 opções:

### Opção A: Rodar do seu computador (se tiver acesso ao PostgreSQL)

Se você conseguir acessar o PostgreSQL do Easy Panel do seu PC (via túnel, VPN ou IP público), execute:

```bash
cd backend
npx tsx scripts/populate-ibge-data.ts
```

### Opção B: Fazer deploy do backend no Easy Panel e executar lá

1. Faça deploy do backend no Easy Panel
2. Execute o script via SSH ou terminal do Easy Panel:

```bash
npx tsx scripts/populate-ibge-data.ts
```

## Credenciais Configuradas

- Host: `dashboard_de_expansao_db-expansao:5432`
- Database: `dashboard_de_Expansao`
- User: `urbanexpansao`
- Password: `urban2026`

## Arquivo migration.sql gerado

O arquivo `migration.sql` contém todo o schema necessário para criar:
- Enums (CityStatus, Mesorregion)
- Tabelas (City, Planning, Task, Comparison, AIQuery, IBGECache)
- Índices
- Foreign Keys

Execute este arquivo no PostgreSQL do Easy Panel para preparar o banco.
