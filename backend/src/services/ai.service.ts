import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config';
import logger from '../config/logger';
import prisma from '../config/database';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Gera resposta de IA baseada em prompt e contexto das cidades
 */
export const generateAiResponse = async (prompt: string): Promise<string> => {
  // Verificar se a API key está configurada
  if (!config.geminiApiKey) {
    throw new Error('Funcionalidade de IA desabilitada. Configure GEMINI_API_KEY para usar.');
  }

  try {
    // Buscar contexto das cidades
    const cities = await prisma.city.findMany({
      take: 50,
      orderBy: { population: 'desc' },
      select: {
        name: true,
        population: true,
        status: true,
        averageIncome: true,
        mesorregion: true,
      },
    });

    const citiesContext = cities
      .map(
        (c) =>
          `${c.name}: Pop ${c.population}, Status ${c.status}, Renda R$${c.averageIncome.toFixed(2)}, Região ${c.mesorregion}`
      )
      .join('\n');

    const systemInstruction = `Você é um especialista em expansão estratégica para a Urban Passageiro em Mato Grosso.
Use os dados abaixo para responder perguntas sobre viabilidade, comparação de cidades e estratégia.

Dados das Cidades:
${citiesContext}

Responda de forma concisa, profissional e focada em negócios. Use dados quantitativos quando possível.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Salvar query no histórico
    await prisma.aIQuery.create({
      data: {
        prompt,
        response: text,
        context: { citiesCount: cities.length },
      },
    });

    return text;
  } catch (error) {
    logger.error('Erro na API Gemini:', error);
    throw new Error('Não foi possível gerar resposta da IA. Verifique a configuração da API.');
  }
};

/**
 * Gera análise de viabilidade para uma cidade
 */
export const generateCityViabilityAnalysis = async (cityId: number): Promise<string> => {
  // Verificar se a API key está configurada
  if (!config.geminiApiKey) {
    throw new Error('Funcionalidade de IA desabilitada. Configure GEMINI_API_KEY para usar.');
  }

  const city = await prisma.city.findUnique({ where: { id: cityId } });
  
  if (!city) {
    throw new Error('Cidade não encontrada');
  }

  const prompt = `Faça uma análise de viabilidade completa para expansão da Urban Passageiro na cidade de ${city.name}, MT.
  
Dados da cidade:
- População: ${city.population}
- População 15-44 anos: ${city.population15to44}
- Renda média: R$ ${city.averageIncome.toFixed(2)}
- Status atual: ${city.status}
- Índice de urbanização: ${(city.urbanizationIndex * 100).toFixed(1)}%
- Área urbanizada: ${city.urbanizedAreaKm2} km²
- Empregos formais: ${city.formalJobs}

Forneça:
1. Potencial de mercado (0-10)
2. Principais oportunidades
3. Desafios esperados
4. Recomendação estratégica
5. Investimento estimado necessário`;

  return await generateAiResponse(prompt);
};
