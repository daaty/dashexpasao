/**
 * Script para popular dados do Censo 2022 do IBGE
 * - População total (Censo 2022)
 * - População 15-44 anos (público-alvo)
 * - Estimativas 2024/2025
 * 
 * Fonte: API SIDRA/IBGE - https://servicodados.ibge.gov.br/api/docs/agregados
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// IDs das faixas etárias para 15-44 anos no agregado 9514
const FAIXAS_15_44 = {
    '93086': '15 a 19 anos',
    '93087': '20 a 24 anos', 
    '93088': '25 a 29 anos',
    '93089': '30 a 34 anos',
    '93090': '35 a 39 anos',
    '93091': '40 a 44 anos'
};

// UF de Mato Grosso
const UF_MT = '51';

interface CensusData {
    ibgeCode: number;
    name: string;
    populationCensus2022: number;
    population15to44Census2022: number;
    populationEstimate2024: number;
    populationEstimate2025: number;
}

async function fetchPopulationTotal2022(municipiosCodes: string[]): Promise<Map<string, number>> {
    console.log('📊 Buscando população total do Censo 2022...');
    
    const result = new Map<string, number>();
    
    // Buscar em lotes de 50 municípios
    const batchSize = 50;
    for (let i = 0; i < municipiosCodes.length; i += batchSize) {
        const batch = municipiosCodes.slice(i, i + batchSize);
        const codesStr = batch.join(',');
        
        // Agregado 4714 - População Residente, Área territorial e Densidade demográfica
        // Variável 93 = População residente
        const url = `https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N6[${codesStr}]`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data && data[0] && data[0].resultados) {
                for (const resultado of data[0].resultados) {
                    for (const serie of resultado.series) {
                        const id = serie.localidade.id;
                        const pop = parseInt(serie.serie['2022']) || 0;
                        result.set(id, pop);
                    }
                }
            }
        } catch (error) {
            console.error(`Erro ao buscar lote ${i}:`, error);
        }
        
        // Aguardar para não sobrecarregar a API
        await new Promise(r => setTimeout(r, 200));
    }
    
    return result;
}

async function fetchPopulation15to44(municipiosCodes: string[]): Promise<Map<string, number>> {
    console.log('👥 Buscando população 15-44 anos do Censo 2022...');
    
    const result = new Map<string, number>();
    
    // Inicializar com 0
    municipiosCodes.forEach(code => result.set(code, 0));
    
    const faixasIds = Object.keys(FAIXAS_15_44).join(',');
    const batchSize = 30; // Menor lote porque são mais dados
    
    for (let i = 0; i < municipiosCodes.length; i += batchSize) {
        const batch = municipiosCodes.slice(i, i + batchSize);
        const codesStr = batch.join(',');
        
        // Variável 93 = População residente
        // Classificação 2[6794] = Total (ambos os sexos)
        // Classificação 287 = Faixas etárias 15-44
        const url = `https://servicodados.ibge.gov.br/api/v3/agregados/9514/periodos/2022/variaveis/93?localidades=N6[${codesStr}]&classificacao=2[6794]|287[${faixasIds}]`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data && data[0] && data[0].resultados) {
                for (const resultado of data[0].resultados) {
                    for (const serie of resultado.series) {
                        const id = serie.localidade.id;
                        const pop = parseInt(serie.serie['2022']) || 0;
                        const current = result.get(id) || 0;
                        result.set(id, current + pop);
                    }
                }
            }
        } catch (error) {
            console.error(`Erro ao buscar lote ${i}:`, error);
        }
        
        await new Promise(r => setTimeout(r, 300));
        process.stdout.write(`\r  Processando: ${Math.min(i + batchSize, municipiosCodes.length)}/${municipiosCodes.length}`);
    }
    console.log('');
    
    return result;
}

async function fetchEstimates(municipiosCodes: string[], year: string): Promise<Map<string, number>> {
    console.log(`📈 Buscando estimativas ${year}...`);
    
    const result = new Map<string, number>();
    const batchSize = 50;
    
    for (let i = 0; i < municipiosCodes.length; i += batchSize) {
        const batch = municipiosCodes.slice(i, i + batchSize);
        const codesStr = batch.join(',');
        
        // Agregado 6579 - População residente estimada
        const url = `https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/${year}/variaveis/9324?localidades=N6[${codesStr}]`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data && data[0] && data[0].resultados) {
                for (const resultado of data[0].resultados) {
                    for (const serie of resultado.series) {
                        const id = serie.localidade.id;
                        const pop = parseInt(serie.serie[year]) || 0;
                        result.set(id, pop);
                    }
                }
            }
        } catch (error) {
            console.error(`Erro ao buscar estimativas ${year} lote ${i}:`, error);
        }
        
        await new Promise(r => setTimeout(r, 200));
    }
    
    return result;
}

async function getMunicipiosMT(): Promise<{ id: string; nome: string }[]> {
    console.log('🗺️ Buscando municípios de Mato Grosso...');
    
    const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${UF_MT}/municipios`;
    const response = await fetch(url);
    const data = await response.json();
    
    return data.map((m: any) => ({
        id: String(m.id),
        nome: m.nome
    }));
}

async function main() {
    console.log('🚀 Iniciando atualização com dados do Censo 2022 do IBGE');
    console.log('=' .repeat(70));
    
    try {
        // 1. Buscar lista de municípios de MT
        const municipios = await getMunicipiosMT();
        console.log(`✅ ${municipios.length} municípios encontrados em Mato Grosso\n`);
        
        const codes = municipios.map(m => m.id);
        
        // 2. Buscar população total do Censo 2022
        const popTotal2022 = await fetchPopulationTotal2022(codes);
        console.log(`  ✓ ${popTotal2022.size} registros de população total\n`);
        
        // 3. Buscar população 15-44 do Censo 2022
        const pop15to44 = await fetchPopulation15to44(codes);
        console.log(`  ✓ ${pop15to44.size} registros de população 15-44 anos\n`);
        
        // 4. Buscar estimativas 2024
        const est2024 = await fetchEstimates(codes, '2024');
        console.log(`  ✓ ${est2024.size} estimativas 2024\n`);
        
        // 5. Buscar estimativas 2025
        const est2025 = await fetchEstimates(codes, '2025');
        console.log(`  ✓ ${est2025.size} estimativas 2025\n`);
        
        // 6. Atualizar banco de dados
        console.log('\n💾 Atualizando banco de dados...');
        
        let updated = 0;
        let notFound = 0;
        
        for (const municipio of municipios) {
            const id = parseInt(municipio.id);
            const censo2022 = popTotal2022.get(municipio.id) || 0;
            const pop15_44 = pop15to44.get(municipio.id) || 0;
            const estimate2024 = est2024.get(municipio.id) || 0;
            const estimate2025 = est2025.get(municipio.id) || 0;
            
            // Calcular proporção 15-44 para estimar população alvo em 2025
            const ratio15to44 = censo2022 > 0 ? pop15_44 / censo2022 : 0.4;
            const pop15to44_2025 = Math.round(estimate2025 * ratio15to44);
            
            try {
                await prisma.city.update({
                    where: { id },
                    data: {
                        population: estimate2025, // População estimada 2025
                        population15to44: pop15to44_2025, // População 15-44 estimada 2025
                        // Campos extras para referência (se existirem no schema)
                        // populationCensus2022: censo2022,
                        // population15to44Census2022: pop15_44,
                        // populationEstimate2024: estimate2024,
                    }
                });
                updated++;
                
                if (updated % 20 === 0 || municipio.nome === 'Cuiabá') {
                    console.log(`  ✅ ${municipio.nome}: Pop2025=${estimate2025.toLocaleString()}, Pop15-44=${pop15to44_2025.toLocaleString()} (${(ratio15to44*100).toFixed(1)}%)`);
                }
            } catch (error) {
                // Cidade não existe no banco
                notFound++;
            }
        }
        
        // 7. Resumo
        console.log('\n' + '='.repeat(70));
        console.log('📊 RESUMO:');
        console.log(`  ✅ Atualizados: ${updated} municípios`);
        console.log(`  ⚠️ Não encontrados: ${notFound} municípios`);
        
        // Mostrar alguns exemplos
        console.log('\n📋 EXEMPLOS DE DADOS:');
        const examples = ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Nova Monte Verde'];
        
        for (const name of examples) {
            const mun = municipios.find(m => m.nome === name);
            if (mun) {
                const censo = popTotal2022.get(mun.id) || 0;
                const p15_44 = pop15to44.get(mun.id) || 0;
                const e2024 = est2024.get(mun.id) || 0;
                const e2025 = est2025.get(mun.id) || 0;
                const ratio = censo > 0 ? (p15_44 / censo * 100).toFixed(1) : '0';
                
                console.log(`\n  📍 ${name}:`);
                console.log(`     Censo 2022: ${censo.toLocaleString()} habitantes`);
                console.log(`     Pop 15-44 anos (Censo 2022): ${p15_44.toLocaleString()} (${ratio}%)`);
                console.log(`     Estimativa 2024: ${e2024.toLocaleString()} habitantes`);
                console.log(`     Estimativa 2025: ${e2025.toLocaleString()} habitantes`);
                console.log(`     Pop 15-44 estimada 2025: ${Math.round(e2025 * (p15_44/censo || 0.4)).toLocaleString()}`);
            }
        }
        
        console.log('\n✨ Atualização concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
