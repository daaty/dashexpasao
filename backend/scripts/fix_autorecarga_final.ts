import { Client } from "pg";

const client = new Client({
  host: "148.230.73.27",
  port: 5434,
  database: "urbantmt",
  user: "urbanmt",
  password: "urban2025",
});

async function fixAutorecarga() {
  try {
    await client.connect();
    console.log("🔧 Limpando e recriando estrutura...\n");

    // 1. Verificar o que existe
    console.log("📋 Verificando estrutura atual...");
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Autorecarga' 
      ORDER BY ordinal_position
    `);

    console.log(`   Colunas encontradas: ${cols.rows.length}`);
    const colNames = cols.rows.map((r: any) => r.column_name);
    console.log(`   ${colNames.join(", ")}\n`);

    // 2. Dropar tudo relacionado a id_original
    console.log("🧹 Limpando colunas antigas...");
    try {
      await client.query(`ALTER TABLE "Autorecarga" DROP COLUMN IF EXISTS id_original CASCADE`);
      console.log("   ✅ id_original removido");
    } catch {}

    try {
      await client.query(`ALTER TABLE "Autorecarga" DROP CONSTRAINT IF EXISTS Autorecarga_pkey`);
      console.log("   ✅ Primary key removida");
    } catch {}

    try {
      await client.query(`ALTER TABLE "Autorecarga" DROP COLUMN IF EXISTS id CASCADE`);
      console.log("   ✅ Coluna id removida");
    } catch {}

    // 3. Criar nova coluna uuid_id como primary key
    console.log("\n✨ Criando nova estrutura...");
    await client.query(`
      ALTER TABLE "Autorecarga" 
      ADD COLUMN uuid_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    `);
    console.log("   ✅ Coluna uuid_id criada (primary key)\n");

    // 4. Criar índices
    console.log("🔍 Recreando índices...");
    const indexQueries = [
      `DROP INDEX IF EXISTS idx_autorecarga_id_transacao`,
      `DROP INDEX IF EXISTS idx_autorecarga_data`,
      `DROP INDEX IF EXISTS idx_autorecarga_cnpj_recebedor`,
      `DROP INDEX IF EXISTS idx_autorecarga_createdat`,
      `CREATE INDEX idx_autorecarga_id_transacao ON "Autorecarga"(id_transacao)`,
      `CREATE INDEX idx_autorecarga_data ON "Autorecarga"(data)`,
      `CREATE INDEX idx_autorecarga_cnpj_recebedor ON "Autorecarga"(cnpj_recebedor)`,
      `CREATE INDEX idx_autorecarga_createdat ON "Autorecarga"("createdAt")`,
    ];

    for (const q of indexQueries) {
      await client.query(q);
    }
    console.log("   ✅ Índices criados\n");

    console.log("✅ ESTRUTURA CORRIGIDA!\n");
    console.log("📊 Nova estrutura:");

    const finalCols = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Autorecarga' 
      ORDER BY ordinal_position
    `);

    console.log("   Todas as colunas da tabela Autorecarga:");
    finalCols.rows.forEach((row: any) => {
      const marker = ["uuid_id", "id_transacao", "valor_extraido"].includes(
        row.column_name
      )
        ? "⭐"
        : "  ";
      console.log(
        `   ${marker} ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`
      );
    });

    // Teste
    console.log("\n🧪 TESTE: Inserindo registro com dados reais...");
    try {
      const result = await client.query(
        `INSERT INTO "Autorecarga" (
          id_transacao, valido, agendado, tipo,
          data, hora, valor_extraido, pagador, recebedor,
          cnpj_recebedor, status_recebedor, creditos_calculados
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
         RETURNING uuid_id, id_transacao, valor_extraido`
      );

      const row = result.rows[0];
      console.log("   ✅ INSERT FUNCIONOU!");
      console.log(`      uuid_id (Primary Key): ${row.uuid_id}`);
      console.log(`      id_transacao:          ${row.id_transacao}`);
      console.log(`      valor_extraido:        ${row.valor_extraido}\n`);
    } catch (err: any) {
      console.error("   ❌ Erro no teste:", err.message, "\n");
    }

    console.log("🎯 IMPORTANTE para N8N:");
    console.log("   1. NÃO envie a coluna 'uuid_id' - PostgreSQL gera automaticamente");
    console.log("   2. Você pode enviar qualquer coluna normalmente");
    console.log("   3. Todos os UUIDs inválidos serão rejeitados (se forem passados)");
    console.log("   4. Seu PRIMARY KEY é uuid_id (não mais id)\n");

    await client.end();
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    console.error(error.detail);
  }
}

fixAutorecarga();
