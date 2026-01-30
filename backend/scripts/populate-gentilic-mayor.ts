/**
 * Script para popular dados de Gentílico e Prefeito do IBGE
 * - Gentílico - Indicador 60409 da pesquisa 33
 * - Prefeito - Indicador 29170 da pesquisa 33
 * 
 * Fonte: API IBGE Pesquisas - https://servicodados.ibge.gov.br/api/docs/pesquisas
 * 
 * Nota: A data de aniversário da cidade não está disponível na API do IBGE
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// UF de Mato Grosso
const UF_MT = '51';

interface CityExtraData {
    id: number;          // Código IBGE do município
    name: string;
    gentilic?: string;   // Gentílico
    mayor?: string;      // Prefeito
}

/**
 * Busca dados de Gentílico e Prefeito dos municípios
 * Indicadores: 29170 (Prefeito), 60409 (Gentílico)
 */
async function fetchGentilicAndMayor(municipiosCodes: string[]): Promise<Map<string, { gentilic?: string, mayor?: string }>> {
    console.log('👤 Buscando Gentílico e Prefeito...');
    
    const result = new Map<string, { gentilic?: string, mayor?: string }>();
    
    // Buscar em lotes de 50 municípios
    const batchSize = 50;
    for (let i = 0; i < municipiosCodes.length; i += batchSize) {
        const batch = municipiosCodes.slice(i, i + batchSize);
        const codesStr = batch.join('|');
        
        // Indicadores: 29170 (Prefeito), 60409 (Gentílico)
        const url = `https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/29170|60409/resultados/${codesStr}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json() as any[];
            
            // Processar prefeito (29170)
            const prefeitoData = data.find(d => d.id === 29170);
            if (prefeitoData && prefeitoData.res) {
                for (const res of prefeitoData.res) {
                    const localidade = res.localidade;
                    // Pegar o ano mais recente disponível
                    const years = Object.keys(res.res).sort((a, b) => parseInt(b) - parseInt(a));
                    const prefeito = years.length > 0 ? res.res[years[0]] : null;
                    
                    if (!result.has(localidade)) {
                        result.set(localidade, {});
                    }
                    result.get(localidade)!.mayor = prefeito;
                }
            }
            
            // Processar gentílico (60409)
            const gentilicoData = data.find(d => d.id === 60409);
            if (gentilicoData && gentilicoData.res) {
                for (const res of gentilicoData.res) {
                    const localidade = res.localidade;
                    // Pegar o ano mais recente disponível
                    const years = Object.keys(res.res).sort((a, b) => parseInt(b) - parseInt(a));
                    const gentilic = years.length > 0 ? res.res[years[0]] : null;
                    
                    if (!result.has(localidade)) {
                        result.set(localidade, {});
                    }
                    result.get(localidade)!.gentilic = gentilic;
                }
            }
        } catch (error) {
            console.error(`Erro ao buscar lote ${i}:`, error);
        }
        
        await new Promise(r => setTimeout(r, 300));
    }
    
    console.log(`   ✅ ${result.size} municípios com dados encontrados`);
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

/**
 * Formata o gentílico (primeira letra maiúscula)
 */
function formatGentilic(gentilic: string | undefined): string | null {
    if (!gentilic) return null;
    // Remover parênteses e formatar
    const cleaned = gentilic.replace(/\s*\([^)]*\)/g, '').trim();
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

/**
 * Formata o nome do prefeito (title case)
 */
function formatMayor(mayor: string | undefined): string | null {
    if (!mayor) return null;
    return mayor.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

async function main() {
    console.log('\n🚀 Iniciando atualização de Gentílico e Prefeito');
    console.log('=' .repeat(60));
    
    try {
        // 1. Buscar lista de municípios do MT
        const municipios = await fetchMunicipiosMT();
        
        // A API do IBGE usa códigos com 6 dígitos (sem o último verificador)
        const municipiosCodes6 = municipios.map(m => m.id.slice(0, 6));
        
        // 2. Buscar dados de gentílico e prefeito
        const extraData = await fetchGentilicAndMayor(municipiosCodes6);
        
        // 3. Preparar dados para atualização
        console.log('\n📝 Preparando dados para atualização...');
        const cityData: CityExtraData[] = municipios.map(m => {
            const code6 = m.id.slice(0, 6);
            const data = extraData.get(code6) || {};
            return {
                id: parseInt(m.id),
                name: m.nome,
                gentilic: formatGentilic(data.gentilic) || undefined,
                mayor: formatMayor(data.mayor) || undefined
            };
        });
        
        // 4. Atualizar banco de dados
        console.log('\n💾 Atualizando banco de dados...');
        let updated = 0;
        let notFound = 0;
        let withGentilic = 0;
        let withMayor = 0;
        
        for (const data of cityData) {
            try {
                const existing = await prisma.city.findUnique({
                    where: { id: data.id }
                });
                
                if (existing) {
                    const updateData: any = {};
                    
                    if (data.gentilic) {
                        updateData.gentilic = data.gentilic;
                        withGentilic++;
                    }
                    if (data.mayor) {
                        updateData.mayor = data.mayor;
                        withMayor++;
                    }
                    
                    if (Object.keys(updateData).length > 0) {
                        await prisma.city.update({
                            where: { id: data.id },
                            data: updateData
                        });
                    }
                    
                    updated++;
                    
                    // Log de exemplo para algumas cidades
                    if (updated <= 5 || data.name.includes('Cuiabá') || data.name.includes('Várzea Grande')) {
                        console.log(`   ✓ ${data.name}: Gentílico="${data.gentilic || 'N/A'}", Prefeito="${data.mayor || 'N/A'}"`);
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
        console.log(`   📝 Com gentílico: ${withGentilic}`);
        console.log(`   👤 Com prefeito: ${withMayor}`);
        console.log(`   ⚠️ Não encontrados: ${notFound}`);
        
        console.log('\n✅ Atualização concluída com sucesso!');
        
        console.log('\n⚠️  NOTA: A data de aniversário da cidade não está disponível');
        console.log('    na API do IBGE. Esse dado precisaria ser coletado manualmente');
        console.log('    ou de outras fontes como Wikipedia.');
        
    } catch (error) {
        console.error('❌ Erro durante a atualização:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(console.error);
