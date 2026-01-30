import { Client } from "pg";

const client = new Client({
  host: "148.230.73.27",
  port: 5434,
  database: "urbantmt",
  user: "urbanmt",
  password: "urban2025",
});

async function fixAutorecaga2() {
  try {
    await client.connect();
    console.log("✨ Configurando uuid_id como PRIMARY KEY...\n");

    // 1. Adicionar constraint primary key a uuid_id
    console.log("1️⃣  Adicionando PRIMARY KEY a uuid_id...");
    try {
      await client.query(`
        ALTER TABLE "Autorecarga" 
        ADD CONSTRAINT autorecarga_uuid_id_pkey PRIMARY KEY (uuid_id)
      `);
      console.log("   ✅ PRIMARY KEY adicionado\n");
    } catch (err: any) {
      if (err.message.includes("already exists")) {
        console.log("   ℹ️  PRIMARY KEY já existe\n");
      } else {
        throw err;
      }
    }

    // 2. Recrear índices
    console.log("2️⃣  Recreando índices...");
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
    console.log("   ✅ Índices recreados\n");

    // 3. Mostrar estrutura final
    console.log("✅ CONFIGURAÇÃO CONCLUÍDA!\n");
    console.log("📊 Estrutura final da tabela Autorecarga:");

    const finalCols = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'Autorecarga' 
      ORDER BY ordinal_position
    `);

    finalCols.rows.forEach((row: any) => {
      if (
        ["uuid_id", "id_transacao", "valor_extraido", "createdAt", "updatedAt"].includes(
          row.column_name
        )
      ) {
        console.log(`   ⭐ ${row.column_name}: ${row.data_type}`);
        if (row.column_default) {
          console.log(`      └─ DEFAULT: ${row.column_default}`);
        }
      }
    });

    // 4. Verificar indices
    console.log("\n🔍 Índices da tabela:");
    const indexes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'Autorecarga'
    `);

    indexes.rows.forEach((row: any) => {
      console.log(`   ✓ ${row.indexname}`);
    });

    // 5. TESTE FINAL
    console.log("\n🧪 TESTE FINAL: Inserindo registro...");
    try {
      const result = await client.query(
        `INSERT INTO "Autorecarga" (
          id_transacao, valido, tipo, valor_extraido
        ) VALUES ($1, $2, $3, $4) 
         RETURNING uuid_id, id_transacao, valor_extraido, "createdAt"`
      );

      const row = result.rows[0];
      console.log("   ✅ INSERT FUNCIONOU!");
      console.log(`      UUID (pk):  ${row.uuid_id}`);
      console.log(`      Transação:  ${row.id_transacao}`);
      console.log(`      Valor:      ${row.valor_extraido}`);
      console.log(`      Criado em:  ${row.createdAt}\n`);
    } catch (err: any) {
      console.error("   ❌ Erro no teste:", err.message, "\n");
    }

    console.log("🎯 PRÓXIMOS PASSOS:");
    console.log("   1. No N8N PostgreSQL node - NÃO envie 'uuid_id'");
    console.log("   2. Envie os dados normalmente");
    console.log("   3. PostgreSQL gera uuid_id automaticamente");
    console.log("   4. Seu workflow funcionará sem erros UUID!\n");

    await client.end();
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }
}

fixAutorecaga2();
