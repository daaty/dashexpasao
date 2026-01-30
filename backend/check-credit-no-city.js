const { Client } = require('pg');

const N8N_DATABASE_URL = "postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable";

async function checkMissingCity() {
  const client = new Client({
    connectionString: N8N_DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('📊 VERIFICANDO TRANSAÇÕES CREDIT SEM CIDADE\n');

    // Contar transações sem cidade
    const countQuery = `
      SELECT COUNT(*) as total_sem_cidade
      FROM dashboard.transactions
      WHERE type = 'CREDIT'
        AND (city IS NULL OR city = '' OR TRIM(city) = '')
    `;

    const countResult = await client.query(countQuery);
    const totalSemCidade = parseInt(countResult.rows[0].total_sem_cidade) || 0;

    console.log(`Total de transações CREDIT sem cidade: ${totalSemCidade}`);
    console.log('─────────────────────────────────────────\n');

    if (totalSemCidade > 0) {
      // Mostrar detalhes das transações sem cidade
      const detailsQuery = `
        SELECT 
          type,
          description,
          amount,
          quantity,
          city,
          "timestamp"
        FROM dashboard.transactions
        WHERE type = 'CREDIT'
          AND (city IS NULL OR city = '' OR TRIM(city) = '')
        ORDER BY "timestamp" DESC
        LIMIT 20
      `;

      const detailsResult = await client.query(detailsQuery);

      console.log('Primeiras 20 transações:');
      console.log('═════════════════════════════════════════\n');
      
      detailsResult.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. Tipo: ${row.type}`);
        console.log(`   Descrição: ${row.description}`);
        console.log(`   Amount: R$ ${parseFloat(row.amount).toFixed(2).replace('.', ',')}`);
        console.log(`   Quantity: ${row.quantity}`);
        console.log(`   Cidade: [${row.city || 'NULL'}]`);
        console.log(`   Data: ${row.timestamp}`);
        console.log('');
      });

      // Contar por description
      console.log('\n📈 DISTRIBUIÇÃO POR DESCRIÇÃO:');
      console.log('─────────────────────────────────────────');

      const descQuery = `
        SELECT 
          description,
          COUNT(*) as qtd,
          COALESCE(SUM(amount), 0) as total_amount
        FROM dashboard.transactions
        WHERE type = 'CREDIT'
          AND (city IS NULL OR city = '' OR TRIM(city) = '')
        GROUP BY description
        ORDER BY qtd DESC
      `;

      const descResult = await client.query(descQuery);
      
      descResult.rows.forEach(row => {
        console.log(`${row.description}`);
        console.log(`  Quantidade: ${row.qtd}`);
        console.log(`  Total: R$ ${parseFloat(row.total_amount).toFixed(2).replace('.', ',')}`);
        console.log('');
      });
    } else {
      console.log('✅ Nenhuma transação CREDIT sem cidade encontrada!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

checkMissingCity();
