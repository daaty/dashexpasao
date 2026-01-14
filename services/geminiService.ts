import { City } from "../types";
import { GoogleGenAI } from "@google/genai";

export const generateAiResponse = async (prompt: string, cities: City[]): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      console.warn("API_KEY not found in environment variables.");
      return "Erro de configuração: Chave de API não encontrada. Por favor, verifique as configurações do ambiente.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prepare context from cities data
    const topCities = cities.slice(0, 50).map(c => 
      `${c.name}: Pop ${c.population}, Status ${c.status}, Renda R$${c.averageIncome}`
    ).join('\n');

    const systemInstruction = `Você é um especialista em expansão estratégica para a Urban Passageiro em Mato Grosso.
    Use os dados abaixo para responder perguntas sobre viabilidade, comparação de cidades e estratégia.
    Dados das Cidades:
    ${topCities}
    
    Responda de forma concisa, profissional e focada em negócios.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Não foi possível gerar uma resposta no momento.";
  } catch (error) {
    console.error("Erro na API Gemini:", error);
    return "Desculpe, ocorreu um erro ao processar sua solicitação. Verifique se a chave de API está válida.";
  }
};