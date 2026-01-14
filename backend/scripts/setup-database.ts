/**
 * Script completo para configurar o banco de dados PostgreSQL
 * 1. Executa a migração (cria as tabelas)
 * 2. Popula com dados do IBGE (141 municípios)
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import axios from 'axios';
import { PrismaClient, Mesorregion } from '@prisma/client';

const prisma = new PrismaClient();

interface IBGEMunicipio {
  id: number;
  nome: string;
  microrregiao: {
    id: number;
    nome: string;
    mesorregiao: {
      id: number;
      nome: string;
    };
  };
}

interface IBGEPopulacao {
  localidade: string;
  valor: string;
}

// Mapeamento de mesorregiões do IBGE para o enum do banco
const mesorregionMap: Record<string, Mesorregion> = {
  'Norte Mato-grossense': 'NORTE_MATOGROSSENSE',
  'Nordeste Mato-grossense': 'NORDESTE_MATOGROSSENSE',
  'Centro-Sul Mato-grossense': 'CENTRO_SUL_MATOGROSSENSE',
  'Sudeste Mato-grossense': 'SUDESTE_MATOGROSSENSE',
  'Sudoeste Mato-grossense': 'SUDOESTE_MATOGROSSENSE',
};

async function runMigration() {
  console.log('🔧 Executando migração do banco de dados...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    const migrationSQL = readFileSync(
      join(__dirname, '..', 'migration.sql'),
      'utf-8'
    );

    await client.query(migrationSQL);
    console.log('✅ Migração executada com sucesso!');

    // Verificar tabelas criadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📋 Tabelas criadas:', result.rows.map(r => r.table_name).join(', '));

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function fetchPopulationEstimate(cityId: number): Promise<number | null> {
  try {
    const response = await axios.get<IBGEPopulacao[]>(
      `https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2021/variaveis/9324?localidades=N6[${cityId}]`
    );

    if (response.data && response.data.length > 0) {
      const valorStr = response.data[0].valor;
      if (valorStr && valorStr !== '-') {
        return parseInt(valorStr, 10);
      }
    }
  } catch (error) {
    console.error(`Erro ao buscar população para cidade ${cityId}:`, error);
  }
  return null;
}

async function populateIBGEData() {
  console.log('\n🔍 Buscando municípios de Mato Grosso do IBGE...');

  try {
    const response = await axios.get<IBGEMunicipio[]>(
      'https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios'
    );

    const municipios = response.data;
    console.log(`✅ ${municipios.length} municípios encontrados`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const municipio of municipios) {
      const mesorregionName = municipio.microrregiao.mesorregiao.nome;
      const mesorregion = mesorregionMap[mesorregionName];

      if (!mesorregion) {
        console.warn(`⚠️ Mesorregião não mapeada: ${mesorregionName} (${municipio.nome})`);
        skipped++;
        continue;
      }

      console.log(`📍 Processando ${municipio.nome}...`);

      const populationEstimate = await fetchPopulationEstimate(municipio.id);

      if (!populationEstimate) {
        console.log(`⏭️ Pulando ${municipio.nome} (sem dados de população)`);
        skipped++;
        continue;
      }

      const existingCity = await prisma.city.findUnique({
        where: { id: municipio.id },
      });

      if (existingCity) {
        await prisma.city.update({
          where: { id: municipio.id },
          data: {
            name: municipio.nome,
            mesorregion,
            populationEstimate,
          },
        });
        console.log(`✏️ Atualizado: ${municipio.nome}`);
        updated++;
      } else {
        await prisma.city.create({
          data: {
            id: municipio.id,
            name: municipio.nome,
            mesorregion,
            populationEstimate,
            status: 'ANALYZING',
          },
        });
        console.log(`✅ Inserido: ${municipio.nome}`);
        inserted++;
      }

      // Delay para não sobrecarregar a API do IBGE
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log('\n📊 Resumo:');
    console.log(`✅ Inseridos: ${inserted}`);
    console.log(`✏️ Atualizados: ${updated}`);
    console.log(`⏭️ Ignorados: ${skipped}`);
    console.log('✨ População concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao popular dados do IBGE:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Iniciando configuração do banco de dados...\n');

  try {
    // Passo 1: Executar migração
    await runMigration();

    // Passo 2: Popular com dados do IBGE
    await populateIBGEData();

    console.log('\n✨ Configuração do banco de dados concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
