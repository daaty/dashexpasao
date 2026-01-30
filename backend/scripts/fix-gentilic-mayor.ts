/**
 * Script para atualizar municípios que falharam na primeira execução
 * Atualiza apenas os que têm "A definir" como prefeito
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Atualizando municípios que falharam...\n');
    
    // Buscar municípios que falharam (prefeito = "A definir")
    const citiesToFix = await prisma.city.findMany({
        where: {
            mayor: 'A definir'
        },
        select: {
            id: true,
            name: true
        }
    });
    
    console.log(`📋 ${citiesToFix.length} municípios para atualizar\n`);
    
    if (citiesToFix.length === 0) {
        console.log('✅ Todos os municípios já estão com dados!');
        return;
    }
    
    // Buscar dados da API para cada município
    let updated = 0;
    
    for (const city of citiesToFix) {
        // O id da city É o código IBGE
        const ibgeCode = city.id.toString();
        
        try {
            // Buscar gentílico e prefeito
            const url = `https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/29170|60409/resultados/${ibgeCode}`;
            const response = await fetch(url);
            const data = await response.json() as any[];
            
            let gentilic: string | null = null;
            let mayor: string | null = null;
            
            // Processar prefeito (29170)
            const prefeitoData = data.find(d => d.id === 29170);
            if (prefeitoData && prefeitoData.res && prefeitoData.res[0]) {
                const res = prefeitoData.res[0].res;
                const years = Object.keys(res).sort((a, b) => parseInt(b) - parseInt(a));
                mayor = years.length > 0 ? res[years[0]] : null;
            }
            
            // Processar gentílico (60409)
            const gentilicoData = data.find(d => d.id === 60409);
            if (gentilicoData && gentilicoData.res && gentilicoData.res[0]) {
                const res = gentilicoData.res[0].res;
                const years = Object.keys(res).sort((a, b) => parseInt(b) - parseInt(a));
                gentilic = years.length > 0 ? res[years[0]] : null;
            }
            
            // Formatar dados
            if (mayor) {
                mayor = mayor.split(' ')
                    .map((w: string) => {
                        const lower = w.toLowerCase();
                        if (['de', 'da', 'do', 'das', 'dos', 'e'].includes(lower)) return lower;
                        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
                    })
                    .join(' ');
            }
            
            if (gentilic) {
                // Remover complemento entre parênteses e formatar
                gentilic = gentilic.replace(/\s*\([^)]*\)/g, '').trim();
                gentilic = gentilic.charAt(0).toUpperCase() + gentilic.slice(1).toLowerCase();
            }
            
            // Atualizar no banco
            const updateData: any = {};
            if (gentilic) updateData.gentilic = gentilic;
            if (mayor) updateData.mayor = mayor;
            
            if (Object.keys(updateData).length > 0) {
                await prisma.city.update({
                    where: { id: city.id },
                    data: updateData
                });
                updated++;
                console.log(`   ✅ ${city.name}: Prefeito="${mayor || 'N/A'}", Gentílico="${gentilic || 'N/A'}"`);
            }
            
            // Pequena pausa para não sobrecarregar a API
            await new Promise(r => setTimeout(r, 100));
            
        } catch (error) {
            console.error(`   ❌ Erro em ${city.name}:`, error);
        }
    }
    
    console.log(`\n✅ ${updated} municípios atualizados!`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
