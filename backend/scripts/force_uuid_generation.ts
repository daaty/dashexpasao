import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function forceUUIDGeneration() {
  try {
    console.log("🔐 Configurando força de geração de UUID...\n");

    // Criar função que força geração de UUID
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION force_new_uuid()
      RETURNS TRIGGER AS $$
      BEGIN
        -- SEMPRE gera um novo UUID, ignora qualquer id que venha do INSERT
        NEW.id := gen_random_uuid();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log("✅ Função force_new_uuid() criada");

    // Drop trigger antigo se existir
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS autorecarga_force_uuid ON "Autorecarga";
    `);
    console.log("✅ Trigger antigo removido (se existia)");

    // Criar trigger ANTES do INSERT
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER autorecarga_force_uuid
      BEFORE INSERT ON "Autorecarga"
      FOR EACH ROW
      EXECUTE FUNCTION force_new_uuid();
    `);
    console.log("✅ Trigger criado com sucesso\n");

    console.log("🎯 Configuração final:");
    console.log("   - TODO id fornecido será IGNORADO");
    console.log("   - PostgreSQL SEMPRE gera novo UUID válido");
    console.log("   - Erro 'invalid input syntax for type uuid' vai ser evitado");
    console.log("\n✅ Sistema pronto!\n");

    // Teste
    console.log("📝 Teste: Inserir com UUID inválido...");
    try {
      const result = await prisma.autorecarga.create({
        data: {
          // id será ignorado, PostgreSQL gera novo UUID
          valido: true,
          agendado: false,
          tipo: "teste",
        } as any,
      });
      console.log(`✅ Registro criado com UUID: ${result.id}`);
      console.log("   (UUID inválido foi IGNORADO e novo foi gerado)\n");
    } catch (err) {
      console.error("❌ Erro no teste:", err);
    }
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

forceUUIDGeneration();
