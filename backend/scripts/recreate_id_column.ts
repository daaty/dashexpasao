import { Client } from "pg";

const client = new Client({
  host: "148.230.73.27",
  port: 5434,
  database: "urbantmt",
  user: "urbanmt",
  password: "urban2025",
});

async function recreateIdColumn() {
  try {
    await client.connect();
    console.log("🔧 Recriando coluna ID (TEXT, NOT NULL)...\n");

    // 1. Verificar estrutura atual
    console.log("1️⃣  Verificando estrutura atual...");
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Autorecarga' 
      AND column_name = 'id'
    `);

    if (cols.rows.length > 0) {
      console.log(`   ✓ Coluna 'id' encontrada: ${cols.rows[0].data_type}`);
    } else {
      console.log(`   ✗ Coluna 'id' NÃO existe`);
    }
    console.log();

    // 2. Dropar constraint se existir
    console.log("2️⃣  Removendo constraints antigas...");
    try {
      await client.query(`ALTER TABLE "Autorecarga" DROP CONSTRAINT IF EXISTS "Autorecarga_pkey" CASCADE`);
      console.log("   ✓ Primary key removido");
    } catch {}

    try {
      await client.query(`ALTER TABLE "Autorecarga" DROP CONSTRAINT IF EXISTS autorecarga_uuid_pk CASCADE`);
      console.log("   ✓ Constraint UUID removido");
    } catch {}

    try {
      await client.query(`ALTER TABLE "Autorecarga" DROP CONSTRAINT IF EXISTS autorecarga_uuid_id_pkey CASCADE`);
      console.log("   ✓ Constraint uuid_id removido");
    } catch {}
    console.log();

    // 3. Dropar coluna id se existir
    console.log("3️⃣  Limpando coluna ID antiga...");
    try {
      await client.query(`ALTER TABLE "Autorecarga" DROP COLUMN IF EXISTS id CASCADE`);
      console.log("   ✓ Coluna id removida");
    } catch {}
    console.log();

    // 4. Criar coluna id como TEXT NOT NULL (com valor padrão para dados existentes)
    console.log("4️⃣  Criando coluna ID (TEXT, NOT NULL)...");
    await client.query(`
      ALTER TABLE "Autorecarga" 
      ADD COLUMN id TEXT NOT NULL DEFAULT ''
    `);
    console.log("   ✓ Coluna id criada\n");

    // 5. Remover o default agora que os dados têm valor
    console.log("5️⃣  Finalizando configuração...");
    await client.query(`
      ALTER TABLE "Autorecarga" 
      ALTER COLUMN id DROP DEFAULT
    `);
    console.log("   ✓ Configuração concluída\n");

    // 6. Criar primary key em uuid_id se existir
    console.log("6️⃣  Configurando PRIMARY KEY...");
    const uuidCols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'Autorecarga' AND column_name = 'uuid_id'
    `);

    if (uuidCols.rows.length > 0) {
      try {
        await client.query(`
          ALTER TABLE "Autorecarga" 
          ADD CONSTRAINT autorecarga_uuid_id_pkey PRIMARY KEY (uuid_id)
        `);
        console.log("   ✓ PRIMARY KEY em uuid_id criado\n");
      } catch (err: any) {
        if (err.message.includes("already exists")) {
          console.log("   ℹ️  PRIMARY KEY já existe\n");
        } else {
          throw err;
        }
      }
    } else {
      // Se não tiver uuid_id, criar como primary key
      console.log("7️⃣  Criando uuid_id como PRIMARY KEY...");
      try {
        await client.query(`
          ALTER TABLE "Autorecarga" 
          ADD COLUMN uuid_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
        `);
        console.log("   ✓ uuid_id criado como PRIMARY KEY\n");
      } catch (err: any) {
        if (err.message.includes("already exists")) {
          console.log("   ℹ️  uuid_id já existe\n");
        } else {
          throw err;
        }
      }
    }

    // 7. Recrear índices
    console.log("8️⃣  Recreando índices...");
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
    console.log("   ✓ Índices criados\n");

    // 8. Exibir estrutura final
    console.log("✅ ESTRUTURA FINAL:\n");
    const finalCols = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Autorecarga' 
      ORDER BY ordinal_position
    `);

    console.log("Colunas principais:");
    finalCols.rows.forEach((row: any) => {
      if (["uuid_id", "id", "id_transacao", "valor_extraido"].includes(row.column_name)) {
        const nullable = row.is_nullable === "YES" ? "permite NULL" : "❌ NOT NULL";
        console.log(`  ✓ ${row.column_name}: ${row.data_type} (${nullable})`);
      }
    });

    console.log("\n🎯 IMPORTANTE:");
    console.log("  • id: TEXT, NOT NULL - aceita QUALQUER STRING");
    console.log("  • id: Não pode ficar vazio");
    console.log("  • uuid_id: UUID PRIMARY KEY - gerado automaticamente");
    console.log("  • N8N: Envie 'id' com qualquer formato desejado\n");

    // 9. TESTE
    console.log("🧪 TESTE: Inserindo com ID customizado...");
    try {
      const result = await client.query(
        `INSERT INTO "Autorecarga" (
          id, id_transacao, valido, tipo
        ) VALUES ($1, $2, $3, $4) 
         RETURNING uuid_id, id, id_transacao`
      );

      const row = result.rows[0];
      console.log("   ✅ INSERT FUNCIONOU!");
      console.log(`      uuid_id:       ${row.uuid_id}`);
      console.log(`      id (custom):   ${row.id}`);
      console.log(`      id_transacao:  ${row.id_transacao}\n`);
    } catch (err: any) {
      console.error("   ❌ Erro no teste:", err.message, "\n");
    }

    console.log("✅ PRONTO PARA N8N!\n");
    await client.end();
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }
}

recreateIdColumn();
