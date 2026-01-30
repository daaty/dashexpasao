# SOLUÇÃO DEFINITIVA - PostgreSQL como Fonte Única da Verdade

## PROBLEMA IDENTIFICADO

O sistema tem múltiplas fontes de verdade conflitantes:
1. **PostgreSQL** - banco de dados (deveria ser fonte única)
2. **localStorage** - cache do navegador (está sobrescrevendo dados corretos)
3. **internalData.ts** - dados estáticos (apenas fallback temporário)

**Resultado**: Dados são salvos no localStorage mas NUNCA no PostgreSQL, causando perda de dados e inconsistências.

## SOLUÇÃO IMPLEMENTADA

### 1. ✅ Refatoração do `persistCityStatus`
- **ANTES**: Salvava primeiro no localStorage, tentava PostgreSQL depois
- **AGORA**: Salva PRIMEIRO no PostgreSQL, atualiza localStorage apenas após sucesso
- **Código**: `context/DataContext.tsx` linhas 446-459

### 2. ✅ Desativação do `persistCities`
- **ANTES**: Salvava array completo de cidades no localStorage
- **AGORA**: Função deprecated - não faz nada
- **Motivo**: Evitar sobrescrever dados corretos do PostgreSQL

### 3. ✅ Remoção de salvamento em `merge`
- **ANTES**: Após merge, salvava tudo no localStorage
- **AGORA**: Merge apenas para exibição, sem salvar
- **Código**: `context/DataContext.tsx` linha 289 removida

## O QUE AINDA PRECISA SER FEITO

### CRÍTICO: Garantir que PLANEJAMENTOS sejam salvos no PostgreSQL

#### Problema Atual:
```typescript
// Em addPlanForCity (linha 593-611)
try {
    const savedPlan = await planningApi.createPlanning(planningDTO);
    console.log('✅ Planejamento salvo no backend:', savedPlan);
    if (savedPlan?.id) {
        newPlan.id = savedPlan.id;
    }
} catch (error) {
    console.error('❌ Erro ao salvar no backend, salvando localmente:', error);
    // PROBLEMA: Continua mesmo se falhar no backend!
}
```

#### Solução:
1. NÃO permitir salvar planejamento se falhar no PostgreSQL
2. Mostrar erro claro ao usuário
3. Não atualizar UI com dados não persistidos

### Código Correto:

```typescript
const addPlanForCity = async (cityId: number) => {
    // ... validações ...

    try {
        // 1. SEMPRE criar plano no PostgreSQL PRIMEIRO
        const planningDTO: planningApi.PlanningDTO = {
            cityId,
            title: `Expansão em ${city.name}`,
            description: `Planejamento de expansão para ${city.name}`,
            startDate: now,
            status: 'active',
            priority: 'medium',
            tags: ['expansão'],
            tasks: []
        };
        
        const savedPlan = await planningApi.createPlanning(planningDTO);
        
        if (!savedPlan?.id) {
            throw new Error('Backend não retornou ID do planejamento');
        }

        console.log('✅ Planejamento salvo no PostgreSQL:', savedPlan);
        
        // 2. Criar objeto local COM ID do backend
        const newPlan: CityPlan = {
            id: savedPlan.id,  // ID do PostgreSQL
            cityId,
            startDate: now.slice(0, 7),
            phases: DEFAULT_PHASE_TEMPLATES.map((t, phaseIndex) => ({
                name: t.name,
                startDate: phaseStartDate,
                actions: t.actions.map((desc, i) => ({ 
                    id: `${Date.now()}-${phaseIndex}-${i}`, 
                    description: desc, 
                    completed: false, 
                    createdAt: now, 
                    tagIds: [] 
                }))
            }))
        };
        
        // 3. Salvar localmente APENAS como cache
        const filteredPlans = plans.filter(p => p.cityId !== cityId);
        const updatedPlans = [...filteredPlans, newPlan];
        setPlans(updatedPlans);
        localStorage.setItem('urban_plans', JSON.stringify(updatedPlans));
        
        // 4. Atualizar status da cidade no PostgreSQL
        await persistCityStatus(cityId, CityStatus.Planning);
        
        // 5. Atualizar UI apenas após tudo ter sucesso
        const updatedCities = cities.map(c => {
            if (c.id === cityId) {
                return { ...c, status: CityStatus.Planning };
            }
            return c;
        });
        setCities(updatedCities);
        
        console.log('✅ Planejamento criado com sucesso');
        
    } catch (error) {
        console.error('❌ ERRO CRÍTICO ao criar planejamento:', error);
        // NÃO atualizar UI - mostrar erro ao usuário
        alert(`Erro ao criar planejamento: ${error.message}\n\nTente novamente.`);
        throw error;
    }
};
```

## PASSOS PARA IMPLEMENTAR

1. ✅ **Atualizar `persistCityStatus`** - FEITO
2. ✅ **Desativar `persistCities`** - FEITO  
3. ✅ **Remover salvamento no merge** - FEITO
4. ❌ **Corrigir `addPlanForCity`** - PENDENTE (código acima)
5. ❌ **Popular todas cidades no PostgreSQL** - PENDENTE
6. ❌ **Limpar localStorage completamente** - PENDENTE (versão 9.0 preparada)

## COMANDOS PARA EXECUTAR

### 1. Verificar status atual:
```bash
cd backend
npx ts-node --transpile-only check-all-plannings.ts
```

### 2. Corrigir status de cidades com planos:
```bash
npx ts-node --transpile-only fix-both-cities-status.ts
```

### 3. No navegador (Console F12):
```javascript
localStorage.clear();
location.reload();
```

## GARANTIAS APÓS IMPLEMENTAÇÃO

✅ TODO planejamento salvo no PostgreSQL primeiro
✅ Status de cidade SEMPRE sincronizado com PostgreSQL  
✅ localStorage apenas como cache de leitura
✅ Dados persistem mesmo mudando de computador
✅ Não há mais perda de dados ao recarregar página
✅ Fonte única da verdade: PostgreSQL

## PRÓXIMOS PASSOS

1. Implementar o código correto do `addPlanForCity` acima
2. Testar criação de planejamento
3. Verificar no PostgreSQL se foi salvo
4. Popular todas as 141 cidades
5. Testar em produção
