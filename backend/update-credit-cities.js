const { Pool } = require('pg');

// Configuração do banco N8N
const N8N_DATABASE_URL = "postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable";

const pool = new Pool({
  connectionString: N8N_DATABASE_URL,
});

async function updateCitiesForCreditTransactions() {
  try {
    console.log('🔍 Buscando transações de crédito sem cidade...\n');

    // Primeiro, vamos identificar os motoristas com transações sem cidade
    const driversWithoutCity = await pool.query(`
      SELECT DISTINCT "driverId"
      FROM dashboard.transactions 
      WHERE (city IS NULL OR city = '' OR TRIM(city) = '' OR city = 'null')
      AND type = 'CREDIT'
    `);

    console.log(`📋 Encontrados ${driversWithoutCity.rows.length} motoristas com transações de crédito sem cidade:\n`);

    let updatedCount = 0;
    let totalTransactions = 0;

    for (const driver of driversWithoutCity.rows) {
      const driverId = driver.driverId;
      
      // Buscar uma cidade válida para este motorista
      const cityQuery = await pool.query(`
        SELECT city, COUNT(*) as count
        FROM dashboard.transactions 
        WHERE "driverId" = $1 
        AND city IS NOT NULL 
        AND city != '' 
        AND TRIM(city) != '' 
        AND city != 'null'
        GROUP BY city
        ORDER BY count DESC
        LIMIT 1
      `, [driverId]);

      if (cityQuery.rows.length > 0) {
        const cityName = cityQuery.rows[0].city;
        const cityCount = cityQuery.rows[0].count;
        
        console.log(`👤 Driver ${driverId}: Cidade mais comum = ${cityName} (${cityCount} transações)`);

        // Contar quantas transações sem cidade este motorista tem
        const countQuery = await pool.query(`
          SELECT COUNT(*) as count
          FROM dashboard.transactions 
          WHERE "driverId" = $1 
          AND (city IS NULL OR city = '' OR TRIM(city) = '' OR city = 'null')
          AND type = 'CREDIT'
        `, [driverId]);

        const transactionsToUpdate = parseInt(countQuery.rows[0].count);
        totalTransactions += transactionsToUpdate;

        // Atualizar as transações sem cidade
        const updateResult = await pool.query(`
          UPDATE dashboard.transactions 
          SET city = $1, "updatedAt" = NOW()
          WHERE "driverId" = $2 
          AND (city IS NULL OR city = '' OR TRIM(city) = '' OR city = 'null')
          AND type = 'CREDIT'
        `, [cityName, driverId]);

        console.log(`   ✅ Atualizadas ${updateResult.rowCount} transações de crédito\n`);
        updatedCount += updateResult.rowCount;

      } else {
        console.log(`👤 Driver ${driverId}: ❌ Nenhuma cidade encontrada em outras transações\n`);
      }
    }

    console.log(`\n📊 Resumo da atualização:`);
    console.log(`Total de motoristas processados: ${driversWithoutCity.rows.length}`);
    console.log(`Total de transações identificadas: ${totalTransactions}`);
    console.log(`Total de transações atualizadas: ${updatedCount}`);

    // Verificar quantas transações ainda ficaram sem cidade
    const remainingQuery = await pool.query(`
      SELECT COUNT(*) as remaining
      FROM dashboard.transactions 
      WHERE (city IS NULL OR city = '' OR TRIM(city) = '' OR city = 'null')
      AND type = 'CREDIT'
    `);

    console.log(`Transações de crédito ainda sem cidade: ${remainingQuery.rows[0].remaining}`);

  } catch (error) {
    console.error('❌ Erro ao atualizar cidades:', error);
  } finally {
    await pool.end();
  }
}

updateCitiesForCreditTransactions();