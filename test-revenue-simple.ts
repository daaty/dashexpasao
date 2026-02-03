#!/usr/bin/env npx ts-node
import fetch from 'node-fetch';

async function testEndpoint() {
  const cities = ['Nova Monte Verde', 'Nova Bandeirantes', 'Apiacás', 'Paranaíta'];
  
  console.log('🔗 Testando novo endpoint de receita projetada\n');
  
  for (const city of cities) {
    try {
      const encoded = encodeURIComponent(city);
      const url = `http://localhost:3001/api/plannings/revenue/${encoded}`;
      
      const response = await fetch(url);
      const data: any = await response.json();
      
      if (data.success) {
        const jan2026 = data.data['2026-01'];
        console.log(`✅ ${city.padEnd(20)}: R$ ${jan2026}`);
      }
    } catch (e: any) {
      console.log(`❌ ${city.padEnd(20)}: ${e.message}`);
    }
  }
}

setTimeout(() => testEndpoint(), 1000);
