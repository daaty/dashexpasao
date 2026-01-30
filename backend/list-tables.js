const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://n8n_user:n8n_pw@148.230.73.27:5432/postgres?sslmode=disable'
});

(async () => {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('Tabelas no banco:');
    res.rows.forEach(row => console.log('  -', row.table_name));
  } catch(e) { console.error(e.message); }
  finally { await client.end(); }
})();
