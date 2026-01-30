/**
 * Script para atualizar dados das cidades usando o Censo 2022 do IBGE
 * 
 * Indicadores utilizados:
 * - 96385: População residente (Censo 2022)
 * - 96386: Densidade demográfica
 * - 143558: Salário médio mensal (em salários mínimos)
 * - 143514: Pessoal ocupado (empregos formais)
 * - 29170: Prefeito
 * - 29167: Área da unidade territorial (km²)
 * - 47001: PIB per capita
 * - 95335: Área urbanizada (km²)
 * - 60030: Esgotamento sanitário (% urbanização proxy)
 * 
 * População por faixa etária (Censo 2022 - Pesquisa 10101):
 * - 97527, 97528: 15-19 anos (Homens/Mulheres)
 * - 97545, 97546: 20-24 anos
 * - 97563, 97564: 25-29 anos
 * - 97581, 97582: 30-34 anos
 * - 97599, 97600: 35-39 anos
 * - 97617, 97618: 40-44 anos
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// Configurações
const ESTADO_MT = '51'; // Código do Mato Grosso
const SALARIO_MINIMO_2024 = 1412; // Valor do salário mínimo em 2024

// Indicadores de faixa etária 15-44 anos (Censo 2022)
const INDICADORES_FAIXA_ETARIA = [
    97527, 97528, // 15-19 anos
    97545, 97546, // 20-24 anos
    97563, 97564, // 25-29 anos
    97581, 97582, // 30-34 anos
    97599, 97600, // 35-39 anos
    97617, 97618  // 40-44 anos
];

// Indicadores principais
const INDICADORES_PRINCIPAIS = [
    '96385',  // População residente (Censo 2022)
    '96386',  // Densidade demográfica
    '143558', // Salário médio mensal (salários mínimos)
    '143514', // Pessoal ocupado
    '29170',  // Prefeito
    '29167',  // Área territorial (km²)
    '47001',  // PIB per capita
    '95335',  // Área urbanizada (km²)
    '60030',  // % esgotamento sanitário (proxy urbanização)
];

// Delay para evitar rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Busca lista de todos os municípios do MT
 */
async function fetchMunicipios() {
    console.log('📡 Buscando lista de municípios do Mato Grosso...');
    const response = await axios.get(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ESTADO_MT}/municipios`
    );
    console.log(`📍 ${response.data.length} municípios encontrados.`);
    return response.data;
}

/**
 * Busca indicadores principais para um município
 */
async function fetchIndicadoresPrincipais(codigoMunicipio) {
    const indicadores = INDICADORES_PRINCIPAIS.join('%7C');
    const url = `https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/${indicadores}/resultados/${codigoMunicipio}`;
    
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.warn(`⚠️ Erro ao buscar indicadores para ${codigoMunicipio}:`, error.message);
        return [];
    }
}

/**
 * Busca população por faixa etária (15-44 anos) do Censo 2022
 */
async function fetchPopulacaoFaixaEtaria(codigoMunicipio) {
    const indicadores = INDICADORES_FAIXA_ETARIA.join('%7C');
    const url = `https://servicodados.ibge.gov.br/api/v1/pesquisas/10101/periodos/2022/indicadores/${indicadores}/resultados/${codigoMunicipio}`;
    
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.warn(`⚠️ Erro ao buscar faixa etária para ${codigoMunicipio}:`, error.message);
        return [];
    }
}

/**
 * Busca aniversário do município
 */
async function fetchAniversario(codigoMunicipio) {
    try {
        // A API de aniversários retorna todos os municípios, então buscamos a lista completa e filtramos
        const response = await axios.get(
            `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${codigoMunicipio}`
        );
        // Infelizmente a API de localidades não inclui aniversário diretamente
        // Mantemos o valor existente ou usamos um default
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Extrai valor de um indicador da resposta da API
 */
function extrairValorIndicador(dados, indicadorId) {
    if (!dados || !Array.isArray(dados)) return null;
    
    const indicador = dados.find(d => d.id == indicadorId);
    if (!indicador || !indicador.res || !indicador.res[0]) return null;
    
    const resultado = indicador.res[0].res;
    if (!resultado) return null;
    
    // Pega o valor mais recente (última chave)
    const anos = Object.keys(resultado).sort().reverse();
    for (const ano of anos) {
        const valor = resultado[ano];
        if (valor && valor !== '-' && valor !== '...' && valor !== 'X') {
            // Remove formatação e converte para número se possível
            const valorLimpo = String(valor).replace(/\s/g, '').replace(',', '.');
            const numero = parseFloat(valorLimpo);
            return isNaN(numero) ? valor : numero;
        }
    }
    return null;
}

/**
 * Calcula população de 15 a 44 anos somando as faixas etárias
 */
function calcularPopulacao15a44(dadosFaixaEtaria) {
    if (!dadosFaixaEtaria || !Array.isArray(dadosFaixaEtaria)) return 0;
    
    let total = 0;
    for (const indicador of INDICADORES_FAIXA_ETARIA) {
        const valor = extrairValorIndicador(dadosFaixaEtaria, indicador);
        if (valor && typeof valor === 'number') {
            total += valor;
        }
    }
    return total;
}

/**
 * Mapeia nome da mesorregião para o enum
 */
function mapMesorregion(mesoNome) {
    if (!mesoNome) return 'CENTRO_SUL_MATOGROSSENSE';
    if (mesoNome.includes('Norte')) return 'NORTE_MATOGROSSENSE';
    if (mesoNome.includes('Nordeste')) return 'NORDESTE_MATOGROSSENSE';
    if (mesoNome.includes('Sudeste')) return 'SUDESTE_MATOGROSSENSE';
    if (mesoNome.includes('Sudoeste')) return 'SUDOESTE_MATOGROSSENSE';
    if (mesoNome.includes('Centro-Sul') || mesoNome.includes('Centro Sul')) return 'CENTRO_SUL_MATOGROSSENSE';
    return 'CENTRO_SUL_MATOGROSSENSE';
}

/**
 * Processa e atualiza um município
 */
async function processarMunicipio(municipio, index, total) {
    const codigo = municipio.id.toString();
    const codigo6digitos = codigo.slice(0, 6); // Alguns endpoints usam 6 dígitos
    
    console.log(`\n[${index + 1}/${total}] Processando: ${municipio.nome} (${codigo})`);
    
    try {
        // Busca indicadores principais
        const indicadores = await fetchIndicadoresPrincipais(codigo6digitos);
        await delay(100); // Rate limiting
        
        // Busca população por faixa etária
        const dadosFaixaEtaria = await fetchPopulacaoFaixaEtaria(codigo6digitos);
        await delay(100);
        
        // Extrai valores
        const populacao = extrairValorIndicador(indicadores, 96385) || 0;
        const salarioMedio = extrairValorIndicador(indicadores, 143558); // em salários mínimos
        const pessoalOcupado = extrairValorIndicador(indicadores, 143514) || 0;
        const prefeito = extrairValorIndicador(indicadores, 29170);
        const areaTotal = extrairValorIndicador(indicadores, 29167) || 0;
        const pibPerCapita = extrairValorIndicador(indicadores, 47001) || 0;
        const areaUrbanizada = extrairValorIndicador(indicadores, 95335) || 0;
        const taxaEsgotamento = extrairValorIndicador(indicadores, 60030) || 0;
        
        // Calcula população 15-44 anos
        let populacao15a44 = calcularPopulacao15a44(dadosFaixaEtaria);
        
        // Se não conseguiu dados do censo 2022, usa estimativa
        if (populacao15a44 === 0 && populacao > 0) {
            populacao15a44 = Math.round(populacao * 0.44); // Estimativa de 44%
            console.log(`  ⚠️ Usando estimativa para população 15-44: ${populacao15a44}`);
        }
        
        // Calcula salário formal em reais
        const salarioFormalReais = salarioMedio ? salarioMedio * SALARIO_MINIMO_2024 : 0;
        
        // Índice de urbanização (usa taxa de esgotamento como proxy, normalizado)
        const urbanizationIndex = taxaEsgotamento > 0 ? Math.min(taxaEsgotamento / 100, 1) : 0.75;
        
        // Mesorregião
        const mesorregiao = mapMesorregion(municipio.microrregiao?.mesorregiao?.nome);
        
        // Verifica se cidade existe
        const existente = await prisma.city.findUnique({ where: { id: municipio.id } });
        
        const dadosAtualizar = {
            name: municipio.nome,
            mesorregion: mesorregiao,
            population: populacao > 0 ? Math.round(populacao) : (existente?.population || 0),
            population15to44: populacao15a44 > 0 ? populacao15a44 : (existente?.population15to44 || 0),
            averageIncome: pibPerCapita > 0 ? pibPerCapita / 12 : (existente?.averageIncome || 0),
            averageFormalSalary: salarioFormalReais > 0 ? salarioFormalReais : (existente?.averageFormalSalary || 0),
            formalJobs: pessoalOcupado > 0 ? Math.round(pessoalOcupado) : (existente?.formalJobs || 0),
            urbanizationIndex: urbanizationIndex,
            urbanizedAreaKm2: areaUrbanizada > 0 ? areaUrbanizada : (existente?.urbanizedAreaKm2 || 10),
            status: existente?.status || 'NOT_SERVED',
            gentilic: existente?.gentilic || 'matogrossense',
            anniversary: existente?.anniversary || '01/01',
            mayor: prefeito && typeof prefeito === 'string' ? prefeito : (existente?.mayor || 'Não informado'),
        };
        
        // Log dos dados
        console.log(`  📊 População: ${dadosAtualizar.population.toLocaleString('pt-BR')}`);
        console.log(`  👥 Pop 15-44: ${dadosAtualizar.population15to44.toLocaleString('pt-BR')}`);
        console.log(`  💰 Salário médio: R$ ${dadosAtualizar.averageFormalSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`  🏢 Empregos formais: ${dadosAtualizar.formalJobs.toLocaleString('pt-BR')}`);
        console.log(`  🏙️ Área urbanizada: ${dadosAtualizar.urbanizedAreaKm2} km²`);
        console.log(`  👔 Prefeito: ${dadosAtualizar.mayor}`);
        
        // Upsert no banco
        await prisma.city.upsert({
            where: { id: municipio.id },
            create: { id: municipio.id, ...dadosAtualizar },
            update: dadosAtualizar
        });
        
        console.log(`  ✅ Atualizado com sucesso!`);
        return { success: true, city: municipio.nome };
        
    } catch (error) {
        console.error(`  ❌ Erro ao processar ${municipio.nome}:`, error.message);
        return { success: false, city: municipio.nome, error: error.message };
    }
}

/**
 * Função principal
 */
async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  ATUALIZAÇÃO DE DADOS DO IBGE - CENSO 2022                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    try {
        // Busca todos os municípios do MT
        const municipios = await fetchMunicipios();
        
        console.log(`\n🚀 Iniciando atualização de ${municipios.length} municípios...\n`);
        
        const resultados = {
            sucesso: 0,
            falha: 0,
            erros: []
        };
        
        // Processa cada município
        for (let i = 0; i < municipios.length; i++) {
            const resultado = await processarMunicipio(municipios[i], i, municipios.length);
            
            if (resultado.success) {
                resultados.sucesso++;
            } else {
                resultados.falha++;
                resultados.erros.push(resultado);
            }
            
            // Delay entre requisições para evitar rate limiting
            await delay(200);
        }
        
        // Relatório final
        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║  RELATÓRIO FINAL                                             ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log(`\n✅ Atualizados com sucesso: ${resultados.sucesso}`);
        console.log(`❌ Falhas: ${resultados.falha}`);
        
        if (resultados.erros.length > 0) {
            console.log('\n⚠️ Cidades com erro:');
            resultados.erros.forEach(e => console.log(`   - ${e.city}: ${e.error}`));
        }
        
        console.log('\n🎉 Processo concluído!');
        
    } catch (error) {
        console.error('❌ Erro fatal:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Executa
main();
