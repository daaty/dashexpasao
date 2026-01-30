import { Client } from "pg";

const client = new Client({
  host: "148.230.73.27",
  port: 5434,
  database: "urbantmt",
  user: "urbanmt",
  password: "urban2025",
});

async function testUUIDTrigger() {
  try {
    await client.connect();
    console.log("✅ Conectado ao PostgreSQL\n");

    // 1. Verificar se trigger existe
    console.log("🔍 Verificando triggers...");
    const triggerCheck = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE event_object_table = 'Autorecarga'
    `);

    console.log(`Triggers encontrados: ${triggerCheck.rows.length}`);
    triggerCheck.rows.forEach((row: any) => {
      console.log(`  - ${row.trigger_name} em ${row.event_object_table}`);
    });

    // 2. Verificar função
    console.log("\n🔍 Verificando função force_new_uuid...");
    const funcCheck = await client.query(`
      SELECT routine_name FROM information_schema.routines 
      WHERE routine_name = 'force_new_uuid'
    `);
    console.log(
      funcCheck.rows.length > 0 ? "✅ Função encontrada" : "❌ Função NÃO encontrada"
    );

    // 3. TESTE REAL: Inserir com UUID inválido
    console.log("\n🧪 TESTE: Inserindo com UUID inválido...");
    console.log('   UUID: "E3187249520260127212683250UQKAJ"');

    try {
      const result = await client.query(
        `INSERT INTO "Autorecarga" (id, valido, agendado, tipo) 
         VALUES ($1, true, false, 'teste_trigger') 
         RETURNING id`,
        ["E3187249520260127212683250UQKAJ"]
      );

      console.log("✅ INSERT FUNCIONOU!");
      console.log(`   UUID Gerado: ${result.rows[0].id}`);
      console.log("   (UUID inválido foi IGNORADO pelo trigger)\n");

      // 4. Verificar registros
      const verify = await client.query(
        `SELECT id, tipo FROM "Autorecarga" WHERE tipo = 'teste_trigger' ORDER BY "createdAt" DESC LIMIT 3`
      );

      console.log("📊 Últimos registros inseridos:");
      verify.rows.forEach((row: any) => {
        console.log(`   - ${row.id}`);
      });
    } catch (insertError: any) {
      console.error("❌ ERRO no INSERT:");
      console.error(`   ${insertError.message}`);
      console.error("\n⚠️  O trigger NÃO está funcionando!");
      console.error("   Vamos implementar solução alternativa...\n");
    }

    await client.end();
  } catch (error) {
    console.error("Erro:", error);
  }
}

testUUIDTrigger();
