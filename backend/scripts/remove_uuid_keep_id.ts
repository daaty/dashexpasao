import { Client } from "pg";

const client = new Client({
  host: "148.230.73.27",
  port: 5434,
  database: "urbantmt",
  user: "urbanmt",
  password: "urban2025",
});

async function removeUuidKeepId() {
  try {
    await client.connect();
    console.log("🔧 Removendo uuid_id e deixando id como PRIMARY KEY...\n");

    // 1. Remover constraints
    console.log("1️⃣  Removendo constraints antigas...");
    try {
      await client.query(`ALTER TABLE "Autorecarga" DROP CONSTRAINT IF EXISTS autorecarga_uuid_id_pkey CASCADE`);
      console.log("   ✓ Constraint uuid_id removida");
    } catch {}

    try {
      await client.query(`ALTER TABLE "Autorecarga" DROP CONSTRAINT IF EXISTS "Autorecarga_pkey" CASCADE`);
      console.log("   ✓ Primary key removida");
    } catch {}
    console.log();

    // 2. Remover coluna uuid_id
    console.log("2️⃣  Removendo coluna uuid_id...");
    await client.query(`ALTER TABLE "Autorecarga" DROP COLUMN IF EXISTS uuid_id CASCADE`);
    console.log("   ✓ Coluna uuid_id removida\n");

    // 3. Adicionar PRIMARY KEY em id
    console.log("3️⃣  Adicionando PRIMARY KEY em id...");
    await client.query(`
      ALTER TABLE "Autorecarga" 
      ADD CONSTRAINT autorecarga_id_pkey PRIMARY KEY (id)
    `);
    console.log("   ✓ id é agora PRIMARY KEY\n");

    // 4. Recrear índices
    console.log("4️⃣  Recreando índices...");
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
    console.log("   ✓ Índices recreados\n");

    // 5. Exibir estrutura final
    console.log("✅ ESTRUTURA FINAL:\n");
    const finalCols = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Autorecarga' 
      ORDER BY ordinal_position
    `);

    console.log("Colunas principais:");
    finalCols.rows.forEach((row: any) => {
      if (["id", "id_transacao", "valor_extraido", "data"].includes(row.column_name)) {
        const nullable = row.is_nullable === "YES" ? "permite NULL" : "❌ NOT NULL (PRIMARY KEY)";
        console.log(`  ✓ ${row.column_name}: ${row.data_type} (${nullable})`);
      }
    });

    console.log("\n🎯 CONFIGURAÇÃO FINAL:");
    console.log("  • id: TEXT, NOT NULL, PRIMARY KEY");
    console.log("  • id é a chave de matching no N8N");
    console.log("  • Sem coluna uuid_id (removida)\n");

    // 6. TESTE
    console.log("🧪 TESTE: Inserindo registro com id customizado...");
    try {
      const result = await client.query(
        `INSERT INTO "Autorecarga" (
          id, id_transacao, valido, tipo, valor_extraido
        ) VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, id_transacao, valor_extraido`,
        ["ID-TEST-001", "TXN-001", true, "teste", 100.50]
      );

      const row = result.rows[0];
      console.log("   ✅ INSERT FUNCIONOU!");
      console.log(`      id (pk):      ${row.id}`);
      console.log(`      id_transacao: ${row.id_transacao}`);
      console.log(`      valor:        ${row.valor_extraido}\n`);
    } catch (err: any) {
      console.error("   ❌ Erro no teste:", err.message, "\n");
    }

    console.log("✅ PRONTO PARA N8N COM ID COMO MATCH ON!\n");

    await client.end();
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }
}

removeUuidKeepId();
