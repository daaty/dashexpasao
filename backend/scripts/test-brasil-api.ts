import axios from 'axios';

async function testBrasilAPI() {
  try {
    console.log('🔍 Testando Brasil API para dados de cidades MT...\n');
    
    // Teste 1: Sem provider específico
    console.log('1️⃣  Teste sem provider específico:');
    const response1 = await axios.get('https://brasilapi.com.br/api/ibge/municipios/v1/MT');
    console.log('   Primeiro resultado:', JSON.stringify(response1.data[0], null, 2));
    
    // Teste 2: Com provider wikipedia
    console.log('\n2️⃣  Teste com provider Wikipedia:');
    const response2 = await axios.get('https://brasilapi.com.br/api/ibge/municipios/v1/MT?providers=wikipedia');
    console.log('   Primeiro resultado:', JSON.stringify(response2.data[0], null, 2));
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
  }
}

testBrasilAPI();
