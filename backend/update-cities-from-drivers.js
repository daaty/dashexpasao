const { Client } = require('pg');

const N8N_DATABASE_URL = "postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable";

// Mapeamento de driver_id para cidade
const driverCityMapping = {
  16598876: "Colíder",
  17147322: "Colider",
  19660472: "Paranaita",
  17089446: "Matupa",
  17093920: "Guarantã do Norte",
  17101714: "Peixoto de Azevedo",
  12146346: "Matupa",
  16263441: "Matupa",
  16359250: "Matupa",
  16629776: "Colider",
  17109343: "Matupa",
  18859178: "Nova Monte Verde",
  18888847: "Guarantã do Norte",
  17116809: "Peixoto",
  17120373: "Guarantã do Norte",
  17157368: "Guarantã do Norte",
  18916273: "Guarantã do Norte",
  19173088: "Nova Monte Verde",
  17166153: "Matupa",
  18196931: "Guarantã do Norte",
  18354678: "Matupa",
  17168907: "Matupa",
  18373874: "Guarantã do Norte",
  18432284: "Nova Monte Verde",
  17174024: "Peixoto de Azevedo",
  17177070: "Guarantã do Norte",
  17177142: "Matupa",
  18681003: "Nova Monte Verde",
  17180944: "Guarantã do Norte",
  17207660: "Matupa",
  17291892: "Matupa",
  17329550: "Guarantã do Norte",
  17528787: "Peixoto de Azevedo",
  17650720: "Peixoto de Azevedo",
  18181466: "Peixoto de Azevedo",
  18173897: "Nova Monte Verde",
  18189088: "Nova Bandeirantes",
  18480132: "Nova Bandeirantes",
  18774606: "Nova Monte Verde",
  18832835: "Nova Monte Verde",
  18839494: "Nova Bandeirantes",
  19047936: "Nova Bandeirantes",
  19243027: "Nova Monte Verde",
  19388072: "Nova Monte Verde",
  19531720: "Alta Floresta",
  19584947: "Paranaita",
  19584961: "Paranaita",
  19604634: "Apiacás",
  19258346: "Nova Monte Verde"
};

async function updateCitiesFromDrivers() {
  const client = new Client({
    connectionString: N8N_DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('📊 ATUALIZANDO CIDADES A PARTIR DO DRIVER_ID\n');

    // Primeiro, verificar quantas transações vão ser atualizadas
    const driverIds = Object.keys(driverCityMapping);
    const placeholders = driverIds.map((_, i) => `$${i + 1}`).join(', ');
    
    const checkQuery = `
      SELECT 
        "driverId",
        COUNT(*) as qtd,
        COALESCE(SUM(amount), 0) as total_amount
      FROM dashboard.transactions
      WHERE type = 'CREDIT'
        AND (city IS NULL OR city = '' OR TRIM(city) = '')
        AND "driverId" IN (${placeholders})
      GROUP BY "driverId"
      ORDER BY qtd DESC
    `;

    const checkResult = await client.query(checkQuery, driverIds);
    
    console.log('Transações a serem atualizadas:');
    console.log('─────────────────────────────────────────');
    
    let totalTransacoes = 0;
    let totalAmount = 0;

    checkResult.rows.forEach(row => {
      const cidade = driverCityMapping[row.driverId];
      const amount = parseFloat(row.total_amount) || 0;
      totalTransacoes += parseInt(row.qtd);
      totalAmount += amount;
      
      console.log(`Driver ${row.driverId} (${cidade})`);
      console.log(`  Transações: ${row.qtd}`);
      console.log(`  Total: R$ ${amount.toFixed(2).replace('.', ',')}`);
      console.log('');
    });

    console.log('─────────────────────────────────────────');
    console.log(`✅ Total a atualizar: ${totalTransacoes} transações`);
    console.log(`✅ Valor total: R$ ${totalAmount.toFixed(2).replace('.', ',')}\n`);

    // Agora fazer o UPDATE para cada driver_id
    console.log('🔄 Iniciando atualização...\n');

    let updatedCount = 0;

    for (const [driverId, cidade] of Object.entries(driverCityMapping)) {
      const updateQuery = `
        UPDATE dashboard.transactions
        SET city = $1
        WHERE type = 'CREDIT'
          AND (city IS NULL OR city = '' OR TRIM(city) = '')
          AND "driverId" = $2
      `;

      const updateResult = await client.query(updateQuery, [cidade, parseInt(driverId)]);
      if (updateResult.rowCount > 0) {
        updatedCount += updateResult.rowCount;
        console.log(`✅ Driver ${driverId} → ${cidade}: ${updateResult.rowCount} linhas atualizadas`);
      }
    }

    console.log('\n' + '═'.repeat(40));
    console.log(`✅ SUCESSO! ${updatedCount} transações atualizadas com cidades`);
    console.log('═'.repeat(40));

    // Verificar resultado final
    const finalCheckQuery = `
      SELECT COUNT(*) as total_sem_cidade
      FROM dashboard.transactions
      WHERE type = 'CREDIT'
        AND (city IS NULL OR city = '' OR TRIM(city) = '')
    `;

    const finalCheck = await client.query(finalCheckQuery);
    console.log(`\nTransações CREDIT sem cidade ainda: ${finalCheck.rows[0].total_sem_cidade}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

updateCitiesFromDrivers();
