import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://urbanmt:urban2025@148.230.73.27:5434/urbantmt?sslmode=disable',
});

async function verifyAutorecargaTable() {
  try {
    const client = await pool.connect();

    // Verificar se tabela existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Autorecarga'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('✅ Tabela "Autorecarga" encontrada!\n');

      // Listar colunas
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'Autorecarga'
        ORDER BY ordinal_position;
      `);

      console.log('📋 Colunas na tabela Autorecarga:');
      console.log('─'.repeat(80));
      console.log(
        'COLUNA'.padEnd(30) +
          'TIPO'.padEnd(25) +
          'NULO'.padEnd(10) +
          'PADRÃO'
      );
      console.log('─'.repeat(80));

      columns.rows.forEach((col: any) => {
        const nullableText = col.is_nullable === 'NO' ? 'NÃO' : 'SIM';
        const defaultText = col.column_default ? col.column_default.substring(0, 20) : '-';
        console.log(
          col.column_name.padEnd(30) +
            col.data_type.padEnd(25) +
            nullableText.padEnd(10) +
            defaultText
        );
      });

      // Listar índices
      const indexes = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'Autorecarga'
        ORDER BY indexname;
      `);

      console.log('\n🔍 Índices:');
      console.log('─'.repeat(80));
      indexes.rows.forEach((idx: any) => {
        console.log('   ✓ ' + idx.indexname);
      });

      // Contar registros
      const count = await client.query('SELECT COUNT(*) FROM "Autorecarga"');
      console.log('\n📊 Total de registros: ' + count.rows[0].count);
    } else {
      console.log('❌ Tabela "Autorecarga" não encontrada!');
    }

    client.release();
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verifyAutorecargaTable();
