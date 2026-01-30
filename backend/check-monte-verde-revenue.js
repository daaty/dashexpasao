const { Client } = require('pg');

const N8N_DATABASE_URL = "postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable";

async function checkMonteVerdeRevenue() {
  const client = new Client({
    connectionString: N8N_DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados N8N\n');

    // Query: Receita de créditos de agosto para cá
    console.log('📊 RECEITA DE CRÉDITOS - NOVA MONTE VERDE (Agosto 2025 → Janeiro 2026)\n');
    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "timestamp"), 'YYYY-MM') as mes,
        COALESCE(SUM(amount), 0) as receita,
        COUNT(*) as qtd_transacoes
      FROM dashboard.transactions
      WHERE LOWER(city) = 'nova monte verde'
        AND type = 'CREDIT'
        AND LOWER(description) LIKE '%recarga%'
        AND DATE_TRUNC('month', "timestamp") >= '2025-08-01'
      GROUP BY DATE_TRUNC('month', "timestamp")
      ORDER BY mes ASC
    `;

    const result = await client.query(query);
    
    console.log('Mês       │ Receita (R$)   │ Transações');
    console.log('──────────┼────────────────┼────────────');
    
    let totalReceita = 0;
    let totalTransacoes = 0;

    result.rows.forEach(row => {
      const receita = parseFloat(row.receita) || 0;
      const qtd = parseInt(row.qtd_transacoes) || 0;
      totalReceita += receita;
      totalTransacoes += qtd;
      
      const receitaFormatada = receita.toFixed(2).replace('.', ',');
      console.log(`${row.mes}  │ R$ ${receitaFormatada.padStart(12, ' ')} │ ${qtd}`);
    });

    console.log('──────────┼────────────────┼────────────');
    const totalFormatada = totalReceita.toFixed(2).replace('.', ',');
    console.log(`TOTAL     │ R$ ${totalFormatada.padStart(12, ' ')} │ ${totalTransacoes}`);
    console.log(`\n✅ Período: 6 meses (Agosto 2025 - Janeiro 2026)`);
    console.log(`✅ Total de transações de recarga: ${totalTransacoes}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

checkMonteVerdeRevenue();
