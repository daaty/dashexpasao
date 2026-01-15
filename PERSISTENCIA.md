# Sistema de Persistência de Dados

## 📦 Visão Geral

O sistema agora possui **persistência completa** de todos os dados usando `localStorage`. Todas as informações inseridas são automaticamente salvas e permanecerão disponíveis mesmo após:

- ✅ Atualizar a página (F5)
- ✅ Fechar e reabrir o navegador
- ✅ Fazer login em outro dispositivo (usando o mesmo navegador e perfil)
- ✅ Navegação entre páginas do sistema

## 🔐 Dados Persistidos

### 1. **Planejamentos de Cidades**
- **Chave**: `urban_plans`
- **Conteúdo**: Todos os planejamentos criados com suas fases e ações
- **Salvamento automático**: Ao criar, editar ou excluir ações/fases

### 2. **Status das Cidades**
- **Chave**: `urban_cities_status`
- **Conteúdo**: Status atual de cada cidade (Não Atendida, Planejamento, Implementação, Consolidada)
- **Salvamento automático**: Mudanças manuais ou automáticas (baseadas em progresso)

### 3. **Dados de Mercado**
- **Chave**: `urban_market_data`
- **Conteúdo**: Análises de mercado, SWOT, stakeholders, competidores
- **Salvamento automático**: Ao salvar formulários de análise

### 4. **Blocos de Mercado**
- **Chave**: `urban_market_blocks`
- **Conteúdo**: Blocos criados e cidades atribuídas a cada bloco
- **Salvamento automático**: Ao criar, renomear ou mover cidades entre blocos

### 5. **Templates de Fase**
- **Chave**: `urban_phase_templates`
- **Conteúdo**: Templates personalizados de fases de planejamento
- **Salvamento automático**: Ao editar ou resetar templates

### 6. **Tags de Planejamento**
- **Chave**: `urban_planning_tags`
- **Conteúdo**: Tags customizadas com cores para organização
- **Salvamento automático**: Ao criar, editar ou excluir tags

### 7. **Responsáveis**
- **Chave**: `urban_planning_responsibles`
- **Conteúdo**: Lista de responsáveis com cores e iniciais
- **Salvamento automático**: Ao criar, editar ou excluir responsáveis

## 🔄 Sincronização com Backend

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
