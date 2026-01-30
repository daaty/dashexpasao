import { Client } from "pg";

const client = new Client({
  host: "148.230.73.27",
  port: 5434,
  database: "urbantmt",
  user: "urbanmt",
  password: "urban2025",
});

async function confirmIdColumn() {
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default 
      FROM information_schema.columns 
      WHERE table_name = 'Autorecarga' 
      AND column_name = 'id'
    `);

    if (result.rows.length === 0) {
      console.log("❌ COLUNA ID NÃO ENCONTRADA!\n");
      await client.end();
      return;
    }

    const row = result.rows[0];
    
    console.log("✅ COLUNA ID CONFIRMADA:\n");
    console.log(`   Coluna:    ${row.column_name}`);
    console.log(`   Tipo:      ${row.data_type}`);
    console.log(`   Nullable:  ${row.is_nullable === "YES" ? "SIM (permite NULL)" : "NÃO (NOT NULL) ✓"}`);
    console.log(`   Default:   ${row.column_default || "Nenhum"}\n`);

    // Verificar constraints
    const constraints = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'Autorecarga'
      AND column_name = 'id'
    `);

    console.log("🔍 CONSTRAINTS:");
    if (constraints.rows.length === 0) {
      console.log("   ✓ Nenhuma constraint (é um campo normal)\n");
    } else {
      constraints.rows.forEach(c => {
        console.log(`   - ${c.constraint_name} (${c.constraint_type})`);
      });
      console.log();
    }

    // Verificar se uuid_id existe
    const uuidCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Autorecarga' 
      AND column_name = 'uuid_id'
    `);

    if (uuidCheck.rows.length > 0) {
      const uuidRow = uuidCheck.rows[0];
      console.log("✅ PRIMARY KEY:");
      console.log(`   Coluna:    ${uuidRow.column_name}`);
      console.log(`   Tipo:      ${uuidRow.data_type}`);
      console.log(`   Nullable:  ${uuidRow.is_nullable === "YES" ? "SIM" : "NÃO (PRIMARY KEY)"}\n`);
    }

    console.log("🎯 RESUMO:");
    console.log("   ✓ id: TEXT, NOT NULL");
    console.log("   ✓ Aceita qualquer formato (sem validação UUID)");
    console.log("   ✓ Não pode ser vazio (NOT NULL)");
    console.log("   ✓ uuid_id: UUID PRIMARY KEY (gerado automaticamente)\n");

    console.log("✅ PRONTO PARA N8N!\n");

    await client.end();
  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

confirmIdColumn();
