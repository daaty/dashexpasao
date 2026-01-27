import { n8nDatabase } from '../src/config/n8nDatabase';

async function checkRidesByStatus() {
  try {
    await n8nDatabase.isAvailable();
    
    const total = await n8nDatabase.query(
      `SELECT COUNT(*) as total, status 
       FROM dashboard.rides 
       WHERE LOWER(city) = $1 
       GROUP BY status`,
      ['paranaíta']
    );
    
    console.log('Corridas por status em Paranaíta:');
    total.rows.forEach(r => console.log(`  ${r.status}: ${r.total}`));
    
    const revenue = await n8nDatabase.query(
      `SELECT status, COALESCE(SUM(price), 0) as revenue 
       FROM dashboard.rides 
       WHERE LOWER(city) = $1 
       GROUP BY status`,
      ['paranaíta']
    );
    
    console.log('\nReceita por status:');
    revenue.rows.forEach(r => console.log(`  ${r.status}: R$ ${parseFloat(r.revenue).toFixed(2)}`));
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkRidesByStatus();
