import { Client } from 'pg';

async function analyzeDates() {
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

    // Analisar distribuição de datas em Nova Monte Verde
    console.log('=== Distribuição de corridas por mês em Nova Monte Verde ===\n');
    
    const monthlyQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', r."arrivedTimestamp"), 'YYYY-MM') as month,
        TO_CHAR(DATE_TRUNC('month', r."arrivedTimestamp"), 'Mon/YYYY') as month_name,
        COUNT(*) as total_rides,
        MIN(r."arrivedTimestamp") as first_ride,
        MAX(r."arrivedTimestamp") as last_ride
      FROM dashboard.rides r
      INNER JOIN dashboard.drivers d ON r."driverId" = d.id
      WHERE LOWER(d.city) = 'nova monte verde'
      GROUP BY DATE_TRUNC('month', r."arrivedTimestamp")
      ORDER BY month DESC
    `;
    
    const result = await client.query(monthlyQuery);
    
    console.log(`Total de meses com dados: ${result.rows.length}\n`);
    
    result.rows.forEach((row: any) => {
      console.log(`${row.month} (${row.month_name}):`);
      console.log(`  - Corridas: ${row.total_rides}`);
      console.log(`  - Primeira: ${row.first_ride}`);
      console.log(`  - Última: ${row.last_ride}`);
      console.log('');
    });

    // Verificar amostra de 10 registros
    console.log('\n=== Amostra de 10 corridas recentes ===\n');
    
    const sampleQuery = `
      SELECT 
        r.id,
        r."arrivedTimestamp",
        TO_CHAR(r."arrivedTimestamp", 'YYYY-MM-DD HH24:MI:SS') as formatted_date,
        d.city,
        d.name as driver_name
      FROM dashboard.rides r
      INNER JOIN dashboard.drivers d ON r."driverId" = d.id
      WHERE LOWER(d.city) = 'nova monte verde'
      ORDER BY r."arrivedTimestamp" DESC
      LIMIT 10
    `;
    
    const sampleResult = await client.query(sampleQuery);
    
    sampleResult.rows.forEach((row: any) => {
      console.log(`ID: ${row.id}`);
      console.log(`Data: ${row.formatted_date}`);
      console.log(`Motorista: ${row.driver_name}`);
      console.log('---');
    });

    // Verificar se há algum problema com timezone
    console.log('\n=== Verificação de Timezone ===\n');
    
    const tzQuery = `
      SELECT 
        current_setting('TIMEZONE') as timezone,
        NOW() as current_time,
        NOW() AT TIME ZONE 'UTC' as utc_time
    `;
    
    const tzResult = await client.query(tzQuery);
    console.log('Timezone do banco:', tzResult.rows[0].timezone);
    console.log('Hora atual:', tzResult.rows[0].current_time);
    console.log('Hora UTC:', tzResult.rows[0].utc_time);

    await client.end();
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    await client.end();
  }
}

analyzeDates();
