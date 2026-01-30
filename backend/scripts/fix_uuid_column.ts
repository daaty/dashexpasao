import { Client } from "pg";

const client = new Client({
  host: "148.230.73.27",
  port: 5434,
  database: "urbantmt",
  user: "urbanmt",
  password: "urban2025",
});

async function fixUUIDColumn() {
  try {
    await client.connect();
    console.log("🔧 Corrigindo coluna ID de forma segura...\n");

    // 1. Drop trigger antigo
    console.log("1️⃣  Removendo trigger...");
    await client.query(`DROP TRIGGER IF EXISTS autorecarga_force_uuid ON "Autorecarga"`);
    console.log("   ✅ OK\n");

    // 2. Drop primary key antigo
    console.log("2️⃣  Removendo primary key antigo...");
    await client.query(`ALTER TABLE "Autorecarga" DROP CONSTRAINT "Autorecarga_pkey"`);
    console.log("   ✅ OK\n");

    // 3. Converter coluna id para TEXT (aceita qualquer coisa)
    console.log("3️⃣  Convertendo coluna id para TEXT...");
    await client.query(`ALTER TABLE "Autorecarga" ALTER COLUMN id DROP DEFAULT`);
    await client.query(`ALTER TABLE "Autorecarga" ALTER COLUMN id TYPE TEXT`);
    console.log("   ✅ OK\n");

    // 4. Criar nova coluna UUID como primary key
    console.log("4️⃣  Criando coluna uuid_id como primary key...");
    await client.query(`
      ALTER TABLE "Autorecarga" 
      ADD COLUMN uuid_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    `);
    console.log("   ✅ OK\n");

    // 5. Remover coluna id_original que criamos antes (limpar)
    console.log("5️⃣  Limpando...");
    try {
      await client.query(`ALTER TABLE "Autorecarga" DROP COLUMN IF EXISTS id_original`);
    } catch {}
    console.log("   ✅ OK\n");

    // 6. Criar índices
    console.log("6️⃣  Recreando índices...");
    const queries = [
      `DROP INDEX IF EXISTS idx_autorecarga_id_transacao`,
      `DROP INDEX IF EXISTS idx_autorecarga_data`,
      `DROP INDEX IF EXISTS idx_autorecarga_cnpj_recebedor`,
      `DROP INDEX IF EXISTS idx_autorecarga_createdat`,
      `CREATE INDEX idx_autorecarga_id_transacao ON "Autorecarga"(id_transacao)`,
      `CREATE INDEX idx_autorecarga_data ON "Autorecarga"(data)`,
      `CREATE INDEX idx_autorecarga_cnpj_recebedor ON "Autorecarga"(cnpj_recebedor)`,
      `CREATE INDEX idx_autorecarga_createdat ON "Autorecarga"("createdAt")`,
    ];

    for (const q of queries) {
      await client.query(q);
    }
    console.log("   ✅ OK\n");

    console.log("✅ SOLUÇÃO APLICADA COM SUCESSO!\n");
    console.log("🎯 Nova estrutura:");
    console.log("   - uuid_id: UUID (primary key, @default(uuid()))");
    console.log("   - id: TEXT (aceita QUALQUER STRING, sem validação)");
    console.log("   - N8N pode enviar uuid_id ou não - PostgreSQL gera se não enviar");
    console.log("   - id pode receber qualquer valor sem erro\n");

    // Teste
    console.log("🧪 TESTE: Inserindo com UUID inválido no campo id...");
    try {
      const result = await client.query(
        `INSERT INTO "Autorecarga" (id, id_transacao, valido, agendado, tipo) 
         VALUES ($1, $2, true, false, 'teste_ok') 
         RETURNING uuid_id, id, id_transacao`
      );

      const row = result.rows[0];
      console.log("✅ INSERT FUNCIONOU!");
      console.log(`   uuid_id (Primary Key): ${row.uuid_id}`);
      console.log(`   id (Armazenado):       ${row.id}`);
      console.log(`   id_transacao:          ${row.id_transacao}\n`);
    } catch (err: any) {
      console.error("❌ Erro no teste:", err.message);
    }

    // Verificar estrutura
    console.log("📋 Verificando estrutura da tabela:");
    const struct = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Autorecarga' 
      ORDER BY ordinal_position
    `);

    console.log("\nColunas da Autorecarga:");
    struct.rows.forEach((row: any) => {
      if (["uuid_id", "id", "id_transacao"].includes(row.column_name)) {
        console.log(
          `  ✓ ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`
        );
      }
    });

    await client.end();
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }
}

fixUUIDColumn();
