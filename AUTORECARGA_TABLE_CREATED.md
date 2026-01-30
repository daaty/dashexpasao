
## ✅ Tabela Autorecarga Criada com Sucesso!

**Banco de Dados:** urbantmt  
**Host:** 148.230.73.27:5434  
**Tabela:** Autorecarga  

---

### 📋 Colunas da Tabela

| Coluna | Tipo | Nulável | Padrão |
|--------|------|---------|--------|
| **id** | UUID | NÃO | gen_random_uuid() |
| valido | Boolean | SIM | false |
| agendado | Boolean | SIM | false |
| tipo | VARCHAR(50) | SIM | - |
| id_transacao | VARCHAR(255) | SIM | - |
| data | TIMESTAMP | SIM | - |
| hora | VARCHAR(8) | SIM | - |
| valor_extraido | DECIMAL(12,2) | SIM | - |
| pagador | VARCHAR(255) | SIM | - |
| recebedor | VARCHAR(255) | SIM | - |
| cnpj_recebedor | VARCHAR(18) | SIM | - |
| cnpj_valido | Boolean | SIM | false |
| status_recebedor | VARCHAR(50) | SIM | - |
| creditos_calculados | DECIMAL(12,2) | SIM | - |
| remetente_whatsapp | VARCHAR(20) | SIM | - |
| **createdAt** | TIMESTAMP | SIM | CURRENT_TIMESTAMP |
| **updatedAt** | TIMESTAMP | SIM | CURRENT_TIMESTAMP |

---

### 🔍 Índices Criados

✓ **Autorecarga_pkey** - Chave primária (id)  
✓ **idx_autorecarga_id_transacao** - Para buscar por id_transacao  
✓ **idx_autorecarga_data** - Para buscar por data  
✓ **idx_autorecarga_cnpj_recebedor** - Para buscar por CNPJ  
✓ **idx_autorecarga_createdAt** - Para buscar por data de criação  

---

### 💾 Próximos Passos

Para usar essa tabela no seu código TypeScript, você pode:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Criar um novo registro
const novoRegistro = await prisma.autorecarga.create({
  data: {
    valido: true,
    agendado: false,
    tipo: 'RECARGA_AUTOMATICA',
    id_transacao: 'TXN123456',
    data: new Date(),
    hora: '14:30:00',
    valor_extraido: 100.50,
    pagador: 'João Silva',
    recebedor: 'Empresa X',
    cnpj_recebedor: '12345678000100',
    cnpj_valido: true,
    status_recebedor: 'ATIVO',
    creditos_calculados: 95.00,
    remetente_whatsapp: '5565999999999'
  }
});

// Buscar registros
const registros = await prisma.autorecarga.findMany({
  where: { valido: true },
  orderBy: { data: 'desc' }
});
```

