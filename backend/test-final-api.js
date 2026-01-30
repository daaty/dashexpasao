const { Pool } = require('pg');

// Simular exatamente o que o backend faz agora
class RidesServiceTest {
  constructor() {
    this.pool = new Pool({
      host: '148.230.73.27',
      port: 5432,
      database: 'postgres',
      user: 'n8n_user',
      password: 'n8n_pw',
      ssl: false
    });
  }

  matchCityName(cityName) {
    const normalized = cityName.toLowerCase().trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return [normalized];
  }

  async getMonthlyRidesByCity(cityName, months = 6) {
    try {
      const cityVariations = this.matchCityName(cityName);
      const placeholders = cityVariations.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        WITH monthly_rides AS (
          SELECT 
            TO_CHAR(DATE_TRUNC('month', r."arrivedTimestamp"), 'YYYY-MM') as month,
            EXTRACT(YEAR FROM DATE_TRUNC('month', r."arrivedTimestamp")) as year,
            EXTRACT(MONTH FROM DATE_TRUNC('month', r."arrivedTimestamp")) as month_number,
            DATE_TRUNC('month', r."arrivedTimestamp") as month_start,
            COUNT(DISTINCT r.id) as rides,
            COUNT(DISTINCT DATE(r."arrivedTimestamp")) as unique_days,
            CASE WHEN COUNT(r.price) > 0 THEN AVG(r.price) ELSE 0 END as average_value
          FROM dashboard.rides r
          WHERE LOWER(r.city) IN (${placeholders})
            AND r."arrivedTimestamp" IS NOT NULL
            AND r.status = 'Concluída'
          GROUP BY DATE_TRUNC('month', r."arrivedTimestamp")
        ),
        monthly_revenue AS (
          SELECT 
            DATE_TRUNC('month', t."createdAt") as month_start,
            COALESCE(SUM(t.quantity), 0) as revenue
          FROM dashboard.transactions t
          WHERE t.type = 'CREDIT'
            AND LOWER(t.description) LIKE '%recarga%'
            AND LOWER(t.city) IN (${placeholders})
          GROUP BY DATE_TRUNC('month', t."createdAt")
        )
        SELECT 
          COALESCE(mr.month, TO_CHAR(rev.month_start, 'YYYY-MM')) as month,
          COALESCE(mr.year, EXTRACT(YEAR FROM rev.month_start)) as year,
          COALESCE(mr.month_number, EXTRACT(MONTH FROM rev.month_start)) as month_number,
          COALESCE(mr.rides, 0) as rides,
          COALESCE(rev.revenue, 0) as revenue,
          COALESCE(mr.average_value, 0) as average_value,
          COALESCE(mr.unique_days, 0) as unique_days
        FROM monthly_rides mr
        FULL OUTER JOIN monthly_revenue rev ON mr.month_start = rev.month_start
        ORDER BY COALESCE(mr.month, TO_CHAR(rev.month_start, 'YYYY-MM')) DESC
        LIMIT $${cityVariations.length + 1}
      `;

      const result = await this.pool.query(query, [...cityVariations.map(c => c.toLowerCase()), months]);

      return result.rows.map((row) => ({
        month: row.month,
        year: parseInt(row.year),
        monthNumber: parseInt(row.month_number),
        rides: parseInt(row.rides),
        revenue: parseFloat(row.revenue) || 0,
        averageValue: parseFloat(row.average_value) || 0,
        uniqueDays: parseInt(row.unique_days) || 0,
      }));
    } catch (error) {
      console.error(`Erro ao buscar dados mensais para ${cityName}:`, error);
      return [];
    }
  }

  async close() {
    await this.pool.end();
  }
}

async function testAPICompletion() {
  const service = new RidesServiceTest();
  
  try {
    console.log('🔍 Testando API completa do backend corrigido...\n');
    
    // Simular o que o frontend MarketIntelligence faz
    const cities = ['Nova Bandeirantes', 'Paranaita'];
    const currentMonthKey = '2026-01';
    
    let totalCurrentMonthRides = 0;
    let totalCurrentMonthRevenue = 0;
    
    for (const cityName of cities) {
      console.log(`\n🏙️ Processando ${cityName}:`);
      
      const monthlyData = await service.getMonthlyRidesByCity(cityName, 13);
      
      console.log(`📊 Dados mensais retornados:`, monthlyData.length);
      
      if (monthlyData.length > 0) {
        const monthlyTotals = {};
        
        monthlyData.forEach(m => {
          const monthKey = `${m.year}-${String(m.monthNumber).padStart(2, '0')}`;
          if (!monthlyTotals[monthKey]) {
            monthlyTotals[monthKey] = { rides: 0, revenue: 0 };
          }
          monthlyTotals[monthKey].rides += m.rides;
          monthlyTotals[monthKey].revenue += m.revenue;
        });
        
        // Dados do mês atual
        if (monthlyTotals[currentMonthKey]) {
          totalCurrentMonthRides += monthlyTotals[currentMonthKey].rides;
          totalCurrentMonthRevenue += monthlyTotals[currentMonthKey].revenue;
          console.log(`✅ Janeiro 2026: ${monthlyTotals[currentMonthKey].rides} corridas + R$ ${monthlyTotals[currentMonthKey].revenue.toFixed(2)}`);
        } else {
          console.log(`❌ Janeiro 2026: Sem dados`);
        }
      } else {
        console.log(`❌ Nenhum dado mensal encontrado`);
      }
    }
    
    console.log(`\n💰 RESULTADO FINAL COMO O FRONTEND VÊ:`);
    console.log(`Corridas: ${totalCurrentMonthRides}`);
    console.log(`Receita: R$ ${totalCurrentMonthRevenue.toFixed(2)} = ${(totalCurrentMonthRevenue / 1000).toFixed(1)}k`);
    
    if (Math.abs(totalCurrentMonthRevenue - 2127.50) < 10) {
      console.log(`🎯 PERFEITO! O frontend agora deve mostrar R$ 2.1k em vez de R$ 1.7k`);
    } else {
      console.log(`⚠️ Ainda não está correto. Diferença: R$ ${Math.abs(totalCurrentMonthRevenue - 2127.50).toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await service.close();
  }
}

testAPICompletion();