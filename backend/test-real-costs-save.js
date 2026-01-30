/**
 * Script para testar se os custos reais (realMonthlyCosts) estão sendo salvos corretamente
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function testRealCostsSave() {
  try {
    console.log('🧪 Testando salvamento de custos reais...\n');

    // 1. Preparar dados de teste
    const cityId = 5108956; // Nova Monte Verde
    const testData = {
      results: {
        Mes1: { rides: 100, marketingCost: 500, operationalCost: 300 },
        Mes2: { rides: 120, marketingCost: 600, operationalCost: 350 }
      },
      realMonthlyCosts: {
        '2025-08': { marketingCost: 450, operationalCost: 280 },
        '2025-09': { marketingCost: 550, operationalCost: 320 }
      }
    };

    // 2. Salvar dados
    console.log('📤 Enviando dados para salvar...');
    console.log('Dados:', JSON.stringify(testData, null, 2));
    
    const saveResponse = await axios.post(
      `${API_URL}/plannings/results/${cityId}`,
      testData
    );

    console.log('\n✅ Dados salvos com sucesso!');
    console.log('Resposta:', JSON.stringify(saveResponse.data, null, 2));

    // 3. Recuperar dados para verificar
    console.log('\n📥 Recuperando dados para verificação...');
    const getResponse = await axios.get(
      `${API_URL}/plannings/results/${cityId}`
    );

    const savedData = getResponse.data.data;
    console.log('\n✅ Dados recuperados!');
    console.log('Resultados:', JSON.stringify(savedData.results, null, 2));
    console.log('Custos Reais:', JSON.stringify(savedData.realMonthlyCosts, null, 2));

    // 4. Verificar se os dados foram salvos corretamente
    if (savedData.realMonthlyCosts) {
      console.log('\n✅ realMonthlyCosts foi salvo corretamente na base de dados!');
      console.log('Dados encontrados:', Object.keys(savedData.realMonthlyCosts).join(', '));
    } else {
      console.log('\n❌ realMonthlyCosts NÃO foi salvo na base de dados!');
    }

  } catch (error) {
    console.error('❌ Erro ao testar:', error.response?.data || error.message);
  }
}

testRealCostsSave();
