# Sistema de Persistência de Dados

## 📦 Visão Geral

O sistema utiliza **PostgreSQL como única fonte de dados**. Todos os dados são salvos e carregados diretamente do banco de dados, garantindo consistência e persistência real.

### ⚠️ ATUALIZAÇÃO IMPORTANTE (v12.0)

O localStorage foi **completamente removido** do sistema. Agora:

- ✅ Todos os dados vêm do PostgreSQL
- ✅ Não há mais cache local que possa causar inconsistências
- ✅ Dados persistem mesmo em diferentes navegadores/dispositivos
- ✅ Sincronização em tempo real

## 🔐 Dados Persistidos no PostgreSQL

### 1. **Cidades**
- **Tabela**: `City`
- **Conteúdo**: Todas as cidades com seus dados e status
- **Salvamento**: Direto no banco via API

### 2. **Planejamentos**
- **Tabela**: `Planning`
- **Conteúdo**: Planejamentos criados para cada cidade
- **Salvamento**: Direto no banco via API

### 3. **Detalhes do Planejamento**
- **Tabela**: `PlanDetails`
- **Conteúdo**: Fases, ações e configurações de cada planejamento
- **Salvamento**: Direto no banco via API

### 4. **Resultados do Planejamento**
- **Tabela**: `PlanningResults`
- **Conteúdo**: Projeções financeiras, custos reais, metas
- **Salvamento**: Direto no banco via API

### 5. **Blocos de Mercado**
- **Tabela**: `MarketBlock`
- **Conteúdo**: Blocos de inteligência e cidades associadas
- **Salvamento**: Direto no banco via API

### 6. **Tarefas**
- **Tabela**: `Task`
- **Conteúdo**: Tarefas associadas a planejamentos
- **Salvamento**: Direto no banco via API

## 🔄 Arquitetura de Dados

O sistema possui uma **estratégia híbrida**:

1. **Salvamento Primário**: Sempre salva no `localStorage` primeiro
2. **Tentativa de Sincronização**: Tenta salvar no backend PostgreSQL quando disponível
3. **Fallback Inteligente**: Se backend falhar, continua funcionando com dados locais

### Fluxo de Dados

```
Ação do Usuário
      ↓
Atualização do Estado React
      ↓
Salvamento no localStorage ✅
      ↓
Tentativa de Sync com Backend
      ↓
Backend Disponível?
  ├─ SIM → Salva no PostgreSQL ✅
  └─ NÃO → Continua com dados locais ⚠️
```

## 🎯 Indicador Visual de Salvamento

Um **indicador visual** aparece no canto inferior direito sempre que dados são salvos:

- 🟢 **Verde "Salvando..."**: Durante o salvamento
- ⚫ **Cinza com timestamp**: Última vez que dados foram salvos

## 📊 Console Logs

Todos os salvamentos são registrados no console do navegador (F12) para debugging:

```javascript
✅ Carregado urban_plans: 5
💾 5 planejamento(s) salvo(s) no localStorage
✏️ Ação atualizada em Cuiabá - Marketing & Lançamento: {completed: true}
📅 Fase atualizada em Várzea Grande - Preparação Operacional: {startDate: "2026-01-15"}
💾 Status atualizado para Rondonópolis: Implementation
```

## 🛠️ Como Verificar Dados Salvos

### No Navegador (Chrome/Edge/Firefox)

1. Pressione **F12** para abrir DevTools
2. Vá em **Application** (ou **Armazenamento**)
3. No menu lateral, expanda **Local Storage**
4. Clique no domínio da aplicação
5. Veja todas as chaves que começam com `urban_`

### Via Console

```javascript
// Ver todos os planejamentos
console.log(JSON.parse(localStorage.getItem('urban_plans')))

// Ver status das cidades
console.log(JSON.parse(localStorage.getItem('urban_cities_status')))

// Ver dados de mercado
console.log(JSON.parse(localStorage.getItem('urban_market_data')))

// Limpar todos os dados (CUIDADO!)
localStorage.clear()
```

## 🔧 Troubleshooting

### Dados não estão sendo salvos?

1. **Verifique o console**: Erros serão mostrados em vermelho
2. **Espaço do localStorage**: Limite de ~5-10MB por domínio
3. **Modo anônimo**: localStorage não persiste em modo privado/anônimo
4. **Configurações do navegador**: Cookies/armazenamento podem estar bloqueados

### Dados desapareceram?

1. **Mudou de navegador?**: Dados são por navegador
2. **Mudou de perfil?**: Dados são por perfil do navegador
3. **Limpou cache?**: Pode ter removido localStorage também
4. **Verificar no console**: Execute `Object.keys(localStorage).filter(k => k.startsWith('urban_'))`

### Como fazer backup manual?

```javascript
// Exportar todos os dados
const backup = {};
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('urban_')) {
        backup[key] = localStorage.getItem(key);
    }
});
console.log(JSON.stringify(backup));
// Copie o resultado e salve em arquivo .json

// Restaurar backup
const backup = { /* cole o JSON aqui */ };
Object.keys(backup).forEach(key => {
    localStorage.setItem(key, backup[key]);
});
location.reload();
```

## 🚀 Melhorias Futuras

- [ ] Export/Import de dados em JSON
- [ ] Sincronização automática com backend a cada 30 segundos
- [ ] Detecção de conflitos entre dados locais e backend
- [ ] Versionamento de dados para migrações
- [ ] Backup automático na nuvem

## 📝 Notas Importantes

1. **Dados são locais por padrão**: Cada navegador/dispositivo tem seus próprios dados
2. **Backend é opcional**: Sistema funciona 100% offline
3. **Salvamento é automático**: Não precisa clicar em "Salvar"
4. **Feedback visual**: Indicador mostra quando dados são salvos
5. **Console logs**: Úteis para debugging e auditoria

---

**Desenvolvido com ❤️ para Urban Expansão Dashboard**
