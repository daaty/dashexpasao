require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { Client } = require('pg');

(async () => {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    console.log('Connected to', conn);

    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('Tables:');
    console.log(tablesRes.rows.map(r => r.table_name).join('\n'));

    const colsRes = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);

    console.log('\nColumns:');
    colsRes.rows.forEach(r => {
      console.log(`${r.table_name} | ${r.column_name} | ${r.data_type}`);
    });
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch(e){}
  }
})();
