import { Client } from 'pg';

async function testQuery() {
  const client = new Client({
    host: '148.230.73.27',
    port: 5432,
    database: 'postgres',
    user: 'n8n_user',
    password: 'n8n_pw',
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco N8N\n');

    const cityName = 'nova monte verde';
    
    const query = `
      WITH monthly_rides AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', r."arrivedTimestamp"), 'YYYY-MM') as month,
          EXTRACT(YEAR FROM DATE_TRUNC('month', r."arrivedTimestamp")) as year,
          EXTRACT(MONTH FROM DATE_TRUNC('month', r."arrivedTimestamp")) as month_number,
          COUNT(DISTINCT r.id) as rides,
          COUNT(DISTINCT DATE(r."arrivedTimestamp")) as unique_days
        FROM dashboard.rides r
        LEFT JOIN dashboard.drivers d ON r."driverId" = d.id
        WHERE LOWER(d.city) = $1
          AND r."arrivedTimestamp" IS NOT NULL
        GROUP BY DATE_TRUNC('month', r."arrivedTimestamp")
      ),
      monthly_revenue AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', t."timestamp"), 'YYYY-MM') as month,
          COALESCE(SUM(t.amount), 0) as revenue,
          CASE WHEN COUNT(t.amount) > 0 THEN AVG(t.amount) ELSE 0 END as average_value
        FROM dashboard.transactions t
        INNER JOIN dashboard.drivers d2 ON t."driverId" = d2.id
        WHERE t.type = 'CREDIT' 
          AND LOWER(t.description) LIKE '%recarga%'
          AND LOWER(d2.city) = $1
        GROUP BY DATE_TRUNC('month', t."timestamp")
      )
      SELECT 
        COALESCE(mr.month, rev.month) as month,
        COALESCE(mr.year, EXTRACT(YEAR FROM TO_DATE(rev.month, 'YYYY-MM'))) as year,
        COALESCE(mr.month_number, EXTRACT(MONTH FROM TO_DATE(rev.month, 'YYYY-MM'))) as month_number,
        COALESCE(mr.rides, 0) as rides,
        COALESCE(rev.revenue, 0) as revenue,
        COALESCE(rev.average_value, 0) as average_value,
        COALESCE(mr.unique_days, 0) as unique_days
      FROM monthly_rides mr
      FULL OUTER JOIN monthly_revenue rev ON mr.month = rev.month
      ORDER BY COALESCE(mr.month, rev.month) DESC
      LIMIT 12
    `;
    
    const result = await client.query(query, [cityName]);
    
    console.log(`Total de meses: ${result.rows.length}\n`);
    
    result.rows.forEach((row: any) => {
      console.log(`${row.month}:`);
      console.log(`  Corridas: ${row.rides}`);
      console.log(`  Receita: R$ ${parseFloat(row.revenue).toFixed(2)}`);
      console.log(`  Ticket Médio: R$ ${parseFloat(row.average_value).toFixed(2)}`);
      console.log(`  Dias Ativos: ${row.unique_days}`);
      console.log('');
    });

    await client.end();
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    await client.end();
  }
}

testQuery();
