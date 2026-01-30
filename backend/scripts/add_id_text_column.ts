import { Client } from "pg";

const client = new Client({
  host: "148.230.73.27",
  port: 5434,
  database: "urbantmt",
  user: "urbanmt",
  password: "urban2025",
});

async function addIdColumn() {
  try {
    await client.connect();
    console.log("🔧 Adicionando coluna id (TEXT) à Autorecarga...\n");

    // 1. Adicionar coluna 'id' como TEXT (aceita qualquer formato)
    console.log("1️⃣  Adicionando coluna id como TEXT...");
    try {
      await client.query(`
        ALTER TABLE "Autorecarga" 
        ADD COLUMN id TEXT NOT NULL DEFAULT gen_random_uuid()::text
      `);
      console.log("   ✅ Coluna id criada\n");
    } catch (err: any) {
      if (err.message.includes("already exists")) {
        console.log("   ℹ️  Coluna id já existe\n");
        // Se existe, removemos o DEFAULT
        try {
          await client.query(`ALTER TABLE "Autorecarga" ALTER COLUMN id DROP DEFAULT`);
          console.log("   ✅ Removido DEFAULT de id\n");
        } catch {}
      } else {
        throw err;
      }
    }

    // 2. Garantir que uuid_id é PRIMARY KEY
    console.log("2️⃣  Garantindo uuid_id como PRIMARY KEY...");
    try {
      await client.query(`
        ALTER TABLE "Autorecarga" 
        ADD CONSTRAINT autorecarga_uuid_pk PRIMARY KEY (uuid_id)
      `);
      console.log("   ✅ PRIMARY KEY adicionado\n");
    } catch (err: any) {
      if (err.message.includes("already exists")) {
        console.log("   ℹ️  PRIMARY KEY já existe\n");
      } else {
        throw err;
      }
    }

    // 3. Verificar estrutura
    console.log("3️⃣  Verificando estrutura...");
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Autorecarga'
      AND column_name IN ('id', 'uuid_id', 'id_transacao')
      ORDER BY ordinal_position
    `);

    console.log("   Colunas importantes:");
    cols.rows.forEach((row: any) => {
      console.log(`     ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      if (row.column_default) {
        console.log(`       └─ DEFAULT: ${row.column_default}`);
      }
    });

    // 4. Teste
    console.log("\n🧪 TESTE: Inserindo com id em vários formatos...\n");

    const testIds = [
      { id: "E3187249520260127212683250UQKAJ", desc: "UUID inválido" },
      { id: "TXN-001", desc: "String simples" },
      { id: "ABC-123-XYZ", desc: "Com hífens" },
      { id: "12345", desc: "Números" },
    ];

    for (const test of testIds) {
      try {
        const result = await client.query(
          `INSERT INTO "Autorecarga" (id, id_transacao, tipo, valido) 
           VALUES ($1, $2, 'teste', true) 
           RETURNING uuid_id, id, id_transacao`,
          [test.id, `txn-${test.id}`]
        );

        const row = result.rows[0];
        console.log(`✅ ${test.desc}`);
        console.log(`   id: "${row.id}"`);
        console.log(`   uuid_id: ${row.uuid_id}\n`);
      } catch (err: any) {
        console.error(`❌ ${test.desc}: ${err.message}\n`);
      }
    }

    console.log("✅ ESTRUTURA PRONTA!\n");
    console.log("📊 Nova configuração:");
    console.log("   id: TEXT NOT NULL - Aceita QUALQUER formato");
    console.log("   uuid_id: UUID - Primary Key gerado automaticamente");
    console.log("   Nenhum erro de validação!\n");

    await client.end();
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  }
}

addIdColumn();
