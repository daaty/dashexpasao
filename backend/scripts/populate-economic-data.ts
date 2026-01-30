/**
 * Script para popular dados econômicos do IBGE
 * - Área urbanizada (km²) - Agregado 8418, Variável 12749 (dados 2019)
 * - Salário médio formal mensal (R$) - Agregado 9509, Variável 10143 (dados 2023)
 * - Rendimento domiciliar per capita (R$) - Agregado 10295, Variável 13431 (dados 2022)
 * 
 * Fonte: API SIDRA/IBGE - https://servicodados.ibge.gov.br/api/docs/agregados
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// UF de Mato Grosso
const UF_MT = '51';

interface EconomicData {
    id: number;                      // Código IBGE do município (usado como id na tabela City)
    name: string;
    urbanizedAreaKm2?: number;       // Área urbanizada em km²
    averageFormalSalary?: number;    // Salário médio formal em R$
    averageIncome?: number;          // Rendimento domiciliar per capita em R$ (campo averageIncome no schema)
}

/**
 * Busca área urbanizada dos municípios (Agregado 8418, Variável 12749)
 * Dados disponíveis apenas para 2019
 */
async function fetchUrbanizedArea(municipiosCodes: string[]): Promise<Map<string, number>> {
    console.log('🏙️  Buscando área urbanizada (2019)...');
    
    const result = new Map<string, number>();
    
    // Buscar em lotes de 50 municípios
    const batchSize = 50;
    for (let i = 0; i < municipiosCodes.length; i += batchSize) {
        const batch = municipiosCodes.slice(i, i + batchSize);
        const codesStr = batch.join(',');
        
        // Agregado 8418 - Áreas urbanizadas
        // Variável 12749 = Total de áreas urbanizadas (km²)
        const url = `https://servicodados.ibge.gov.br/api/v3/agregados/8418/periodos/2019/variaveis/12749?localidades=N6[${codesStr}]`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data && data[0] && data[0].resultados) {
                for (const resultado of data[0].resultados) {
                    for (const serie of resultado.series) {
                        const id = serie.localidade.id;
                        const area = parseFloat(serie.serie['2019']) || 0;
                        result.set(id, area);
                    }
                }
            }
        } catch (error) {
            console.error(`Erro ao buscar área urbanizada lote ${i}:`, error);
        }
        
        await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`   ✅ ${result.size} municípios com área urbanizada`);
    return result;
}

/**
 * Busca salário médio formal dos municípios (Agregado 9509, Variável 10143)
 * Dados disponíveis para 2022-2023
 */
async function fetchAverageSalary(municipiosCodes: string[]): Promise<Map<string, number>> {
    console.log('💰 Buscando salário médio formal (2023)...');
    
    const result = new Map<string, number>();
    
    const batchSize = 50;
    for (let i = 0; i < municipiosCodes.length; i += batchSize) {
        const batch = municipiosCodes.slice(i, i + batchSize);
        const codesStr = batch.join(',');
        
        // Agregado 9509 - Estatísticas do CEMPRE
        // Variável 10143 = Salário médio mensal em reais
        const url = `https://servicodados.ibge.gov.br/api/v3/agregados/9509/periodos/2023/variaveis/10143?localidades=N6[${codesStr}]`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data && data[0] && data[0].resultados) {
                for (const resultado of data[0].resultados) {
                    for (const serie of resultado.series) {
                        const id = serie.localidade.id;
                        const salary = parseFloat(serie.serie['2023']) || 0;
                        result.set(id, salary);
                    }
                }
            }
        } catch (error) {
            console.error(`Erro ao buscar salário médio lote ${i}:`, error);
        }
        
        await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`   ✅ ${result.size} municípios com salário médio`);
    return result;
}

/**
 * Busca rendimento domiciliar per capita dos municípios (Agregado 10295, Variável 13431)
 * Dados do Censo 2022
 */
async function fetchAverageIncome(municipiosCodes: string[]): Promise<Map<string, number>> {
    console.log('📈 Buscando rendimento domiciliar per capita (Censo 2022)...');
    
    const result = new Map<string, number>();
    
    const batchSize = 50;
    for (let i = 0; i < municipiosCodes.length; i += batchSize) {
        const batch = municipiosCodes.slice(i, i + batchSize);
        const codesStr = batch.join(',');
        
        // Agregado 10295 - Rendimento domiciliar per capita
        // Variável 13431 = Valor do rendimento nominal médio mensal domiciliar per capita
        // Classificações: Sexo=Total(6794), Grupo de idade=Total(95253), Cor ou raça=Total(95251)
        const url = `https://servicodados.ibge.gov.br/api/v3/agregados/10295/periodos/2022/variaveis/13431?localidades=N6[${codesStr}]&classificacao=2[6794]|58[95253]|86[95251]`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data && data[0] && data[0].resultados) {
                for (const resultado of data[0].resultados) {
                    for (const serie of resultado.series) {
                        const id = serie.localidade.id;
                        const income = parseFloat(serie.serie['2022']) || 0;
                        result.set(id, income);
                    }
                }
            }
        } catch (error) {
            console.error(`Erro ao buscar rendimento per capita lote ${i}:`, error);
        }
        
        await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`   ✅ ${result.size} municípios com rendimento per capita`);
    return result;
}

/**
 * Busca lista de municípios do Mato Grosso
 */
async function fetchMunicipiosMT(): Promise<Array<{id: string, nome: string}>> {
    console.log('🗺️  Buscando lista de municípios do MT...');
    
    const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${UF_MT}/municipios`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`   ✅ ${data.length} municípios encontrados`);
    return data.map((m: any) => ({ id: m.id.toString(), nome: m.nome }));
}

async function main() {
    console.log('\n🚀 Iniciando atualização de dados econômicos do IBGE');
    console.log('=' .repeat(60));
    
    try {
        // 1. Buscar lista de municípios do MT
        const municipios = await fetchMunicipiosMT();
        const municipiosCodes = municipios.map(m => m.id);
        
        // 2. Buscar dados econômicos
        const [urbanizedArea, averageSalary, averageIncome] = await Promise.all([
            fetchUrbanizedArea(municipiosCodes),
            fetchAverageSalary(municipiosCodes),
            fetchAverageIncome(municipiosCodes)
        ]);
        
        // 3. Preparar dados para atualização
        console.log('\n📝 Preparando dados para atualização...');
        const economicData: EconomicData[] = municipios.map(m => ({
            id: parseInt(m.id),
            name: m.nome,
            urbanizedAreaKm2: urbanizedArea.get(m.id),
            averageFormalSalary: averageSalary.get(m.id),
            averageIncome: averageIncome.get(m.id)
        }));
        
        // 4. Atualizar banco de dados
        console.log('\n💾 Atualizando banco de dados...');
        let updated = 0;
        let notFound = 0;
        
        for (const data of economicData) {
            try {
                // Verificar se a cidade existe no banco (usando id = código IBGE)
                const existing = await prisma.city.findUnique({
                    where: { id: data.id }
                });
                
                if (existing) {
                    await prisma.city.update({
                        where: { id: data.id },
                        data: {
                            urbanizedAreaKm2: data.urbanizedAreaKm2 || null,
                            averageFormalSalary: data.averageFormalSalary || null,
                            averageIncome: data.averageIncome || null
                        }
                    });
                    updated++;
                    
                    // Log de exemplo para algumas cidades
                    if (updated <= 5 || data.name.includes('Cuiabá') || data.name.includes('Várzea Grande')) {
                        console.log(`   ✓ ${data.name}: Área=${data.urbanizedAreaKm2?.toFixed(2) || 'N/A'} km², Salário=R$ ${data.averageFormalSalary?.toFixed(2) || 'N/A'}, Renda PC=R$ ${data.averageIncome?.toFixed(2) || 'N/A'}`);
                    }
                } else {
                    notFound++;
                    console.log(`   ⚠️ Município não encontrado no banco: ${data.name} (${data.id})`);
                }
            } catch (error) {
                console.error(`   ❌ Erro ao atualizar ${data.name}:`, error);
            }
        }
        
        // 5. Resumo final
        console.log('\n' + '=' .repeat(60));
        console.log('📊 RESUMO DA ATUALIZAÇÃO:');
        console.log(`   ✅ Municípios atualizados: ${updated}`);
        console.log(`   ⚠️ Municípios não encontrados: ${notFound}`);
        
        // 6. Estatísticas dos dados
        const statsArea = [...urbanizedArea.values()].filter(v => v > 0);
        const statsSalary = [...averageSalary.values()].filter(v => v > 0);
        const statsIncome = [...averageIncome.values()].filter(v => v > 0);
        
        console.log('\n📈 ESTATÍSTICAS DOS DADOS:');
        console.log(`   🏙️ Área urbanizada:`);
        console.log(`      - Com dados: ${statsArea.length} municípios`);
        console.log(`      - Média: ${(statsArea.reduce((a, b) => a + b, 0) / statsArea.length).toFixed(2)} km²`);
        console.log(`      - Máx: ${Math.max(...statsArea).toFixed(2)} km²`);
        
        console.log(`   💰 Salário médio formal:`);
        console.log(`      - Com dados: ${statsSalary.length} municípios`);
        console.log(`      - Média: R$ ${(statsSalary.reduce((a, b) => a + b, 0) / statsSalary.length).toFixed(2)}`);
        console.log(`      - Máx: R$ ${Math.max(...statsSalary).toFixed(2)}`);
        
        console.log(`   📈 Rendimento per capita:`);
        console.log(`      - Com dados: ${statsIncome.length} municípios`);
        console.log(`      - Média: R$ ${(statsIncome.reduce((a, b) => a + b, 0) / statsIncome.length).toFixed(2)}`);
        console.log(`      - Máx: R$ ${Math.max(...statsIncome).toFixed(2)}`);
        
        console.log('\n✅ Atualização concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante a atualização:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
