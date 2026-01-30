#!/usr/bin/env node

/**
 * Teste da API para verificar se cidades e planejamentos são retornados corretamente
 */

const apiBase = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 TESTANDO API DE CIDADES E PLANEJAMENTOS\n');

  try {
    // Test 1: Listar todas as cidades
    console.log('1️⃣  Testando GET /api/cities...');
    let response = await fetch(`${apiBase}/cities?limit=200`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    let data = await response.json();
    console.log(`   ✅ Retornou ${data.data?.length || 0} cidades\n`);

    // Test 2: Listar cidades com status PLANNING
    console.log('2️⃣  Testando GET /api/cities?status=PLANNING...');
    response = await fetch(`${apiBase}/cities?status=PLANNING&limit=100`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
    console.log(`   ✅ Retornou ${data.data?.length || 0} cidades em PLANNING`);
    data.data?.forEach(c => console.log(`      • ${c.name} (ID: ${c.id})`));
    console.log();

    // Test 3: Listar planejamentos
    console.log('3️⃣  Testando GET /api/plannings...');
    response = await fetch(`${apiBase}/plannings`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
    console.log(`   ✅ Retornou ${data.data?.length || 0} planejamentos`);
    data.data?.forEach(p => console.log(`      • Cidade ${p.cityId}: ${p.title}`));
    console.log();

    // Test 4: Listar planejamentos por cidade específica
    console.log('4️⃣  Testando GET /api/plannings?cityId=5108956 (Nova Monte Verde)...');
    response = await fetch(`${apiBase}/plannings?cityId=5108956`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
    console.log(`   ✅ Retornou ${data.data?.length || 0} planejamentos para Nova Monte Verde`);
    if (data.data?.length > 0) {
      console.log(`      ID: ${data.data[0].id}`);
      console.log(`      Título: ${data.data[0].title}`);
    }
    console.log();

    console.log('✅ TODOS OS TESTES PASSARAM!');

  } catch (err) {
    console.error(`❌ Erro: ${err.message}`);
    process.exit(1);
  }
}

testAPI();
