CREATE TABLE IF NOT EXISTS "Autorecarga" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valido BOOLEAN DEFAULT false,
    agendado BOOLEAN DEFAULT false,
    tipo VARCHAR(50),
    id_transacao VARCHAR(255),
    data TIMESTAMP,
    hora VARCHAR(8),
    valor_extraido NUMERIC(12, 2),
    pagador VARCHAR(255),
    recebedor VARCHAR(255),
    cnpj_recebedor VARCHAR(18),
    cnpj_valido BOOLEAN DEFAULT false,
    status_recebedor VARCHAR(50),
    creditos_calculados NUMERIC(12, 2),
    remetente_whatsapp VARCHAR(20),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_autorecarga_id_transacao ON "Autorecarga"(id_transacao);
CREATE INDEX IF NOT EXISTS idx_autorecarga_data ON "Autorecarga"(data);
CREATE INDEX IF NOT EXISTS idx_autorecarga_cnpj_recebedor ON "Autorecarga"(cnpj_recebedor);
CREATE INDEX IF NOT EXISTS idx_autorecarga_createdAt ON "Autorecarga"("createdAt");

-- Confirmar criação
SELECT tablename FROM pg_tables WHERE tablename = 'Autorecarga';
