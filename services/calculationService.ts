import { City } from '../types';
import { PENETRATION_SCENARIOS, PRICE_PER_RIDE } from '../constants';

export const calculatePotentialRevenue = (city: City, scenario: keyof typeof PENETRATION_SCENARIOS = 'Média'): number => {
    if (!city) return 0;
    const penetrationRate = PENETRATION_SCENARIOS[scenario];
    const potentialRides = (city.population15to44 ?? 0) * penetrationRate;
    return potentialRides * PRICE_PER_RIDE;
};

export const getFinancialProjections = (city: City) => {
    return Object.entries(PENETRATION_SCENARIOS).map(([scenario, rate]) => {
        return {
            scenario,
            revenue: ((city.population15to44 ?? 0) * rate) * PRICE_PER_RIDE
        };
    });
};

export const getMarketPotential = (city: City) => {
    return Object.entries(PENETRATION_SCENARIOS).map(([scenario, rate]) => {
        return {
            scenario,
            rides: (city.population15to44 ?? 0) * rate
        };
    });
};

export const getGrowthRoadmap = (city: City, targetPenetration: number) => {
    // This curve reaches the targetPenetration at month 6
    const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0]; 
    const growthRates = curveFactors.map(factor => factor * targetPenetration);
    return growthRates.map((rate, index) => {
        return {
            month: index + 1,
            rides: (city.population15to44 ?? 0) * rate
        };
    });
};

/**
 * Gera roadmap de crescimento estendido para 12 meses (usado para cidades consolidadas)
 * - Meses 1-6: crescimento gradual até 100% da penetração alvo
 * - Meses 7-12: mantém a meta fixa do mês 6
 * @param city Cidade
 * @param targetPenetration Taxa de penetração alvo
 * @returns Array com 6 meses de metas
 */
export const getGrowthRoadmapExtended = (city: City, targetPenetration: number) => {
    // Curva gradual de 6 meses
    const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0]; 
    
    const result = [];
    for (let i = 0; i < 6; i++) {
        const factor = curveFactors[i];
        const rate = factor * targetPenetration;
        result.push({
            month: i + 1,
            rides: (city.population15to44 ?? 0) * rate
        });
    }
    return result;
};

/**
 * Obtém a data efetiva de implementação (usa data atual se não houver uma definida)
 * @param city Cidade
 * @returns Data no formato YYYY-MM
 */
export const getEffectiveImplementationDate = (city: City): string => {
    if (city.implementationStartDate) {
        return city.implementationStartDate;
    }
    // Usa data atual como início hipotético
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Calcula projeção de receita para 6 meses independente da data de implementação
 * Útil para exibir projeções mesmo quando não há data definida
 * @param city Cidade
 * @returns Array com projeção de cada mês
 */
export const getProjectionWithoutDate = (city: City): { month: number; label: string; rides: number; revenue: number }[] => {
    const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0];
    const targetPenetration = PENETRATION_SCENARIOS['Média'];
    const projections = [];
    
    for (let i = 0; i < 6; i++) {
        const factor = curveFactors[i];
        const rides = Math.round((city.population15to44 ?? 0) * factor * targetPenetration);
        const revenue = rides * PRICE_PER_RIDE;
        
        projections.push({
            month: i + 1,
            label: `Mês ${i + 1}`,
            rides,
            revenue
        });
    }
    
    return projections;
};

/**
 * Calcula a meta mensal gradual para uma cidade
 * Usa curva gradual nos primeiros 6 meses e fica fixo na Média depois
 * Se não houver data de implementação, usa data atual como início hipotético
 * @param city Cidade
 * @param monthDate Data do mês em formato YYYY-MM ou Date object
 * @param implementationStartDate Data de início (YYYY-MM) - se null, usa data atual
 * @returns Meta de corridas para aquele mês
 */
export const getGradualMonthlyGoal = (city: City, monthDate: string | Date, implementationStartDate?: string): number => {
    const curveFactors = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0]; // 6 meses
    const targetPenetration = PENETRATION_SCENARIOS['Média'];
    const pop15to44 = city.population15to44 ?? 0;
    
    // Se não há data de implementação, usa data atual como início hipotético
    const effectiveStartDate = implementationStartDate || getEffectiveImplementationDate(city);
    if (!effectiveStartDate) {
        return Math.round(pop15to44 * targetPenetration);
    }
    
    // Converter monthDate para YYYY-MM se for Date
    let monthStr = monthDate instanceof Date 
        ? `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
        : monthDate;
    
    // Parse dates - usar effectiveStartDate ao invés de implementationStartDate
    const [impYear, impMonth] = effectiveStartDate.split('-').map(Number);
    const [curYear, curMonth] = monthStr.split('-').map(Number);
    
    // Calcular diferença em meses (considerando que mês 1 é o mês da implementação)
    const monthDiff = (curYear - impYear) * 12 + (curMonth - impMonth) + 1;
    
    // Se ainda não chegou no mês 1, retorna 0
    if (monthDiff < 1) {
        return 0;
    }
    
    // Se está no primeiro ao sexto mês, usa curva gradual
    if (monthDiff >= 1 && monthDiff <= 6) {
        const factor = curveFactors[monthDiff - 1];
        return Math.round(pop15to44 * factor * targetPenetration);
    }
    
    // Após 6 meses, usa meta fixa (Média)
    return Math.round(pop15to44 * targetPenetration);
};

/**
 * Calcula a meta mensal gradual para um bloco de cidades
 * Soma as metas de cada cidade considerando suas implementações
 */
export const getGradualMonthlyGoalForBlock = (cities: City[], monthDate: string | Date): number => {
    return cities.reduce((total, city) => {
        const goal = getGradualMonthlyGoal(city, monthDate, city.implementationStartDate);
        return total + goal;
    }, 0);
};

export const calculateStateAverages = (cities: City[]): { 
    averageIncome: number; 
    averageTargetAudiencePercentage: number; 
    averagePopulation: number; 
    averagePopulation15to44: number;
    averageFormalSalary: number;
    averageFormalJobs: number;
} => {
    const totalCities = cities.length;
    if (totalCities === 0) {
        return { 
            averageIncome: 0, 
            averageTargetAudiencePercentage: 0, 
            averagePopulation: 0, 
            averagePopulation15to44: 0,
            averageFormalSalary: 0,
            averageFormalJobs: 0
        };
    }

    const totalIncome = cities.reduce((acc, city) => acc + (city.averageIncome ?? 0), 0);
    const totalPopulation = cities.reduce((acc, city) => acc + (city.population ?? 0), 0);
    const totalPopulation15to44 = cities.reduce((acc, city) => acc + (city.population15to44 ?? 0), 0);
    const totalTargetAudiencePercentage = cities.reduce((acc, city) => {
        const population = city.population ?? 0;
        const pop15to44 = city.population15to44 ?? 0;
        const percentage = population > 0 ? pop15to44 / population : 0;
        return acc + percentage;
    }, 0);
    const totalFormalSalary = cities.reduce((acc, city) => acc + (city.averageFormalSalary ?? 0), 0);
    const totalFormalJobs = cities.reduce((acc, city) => acc + (city.formalJobs ?? 0), 0);

    return {
        averageIncome: totalIncome / totalCities,
        averagePopulation: totalPopulation / totalCities,
        averagePopulation15to44: totalPopulation15to44 / totalCities,
        averageTargetAudiencePercentage: (totalTargetAudiencePercentage / totalCities),
        averageFormalSalary: totalFormalSalary / totalCities,
        averageFormalJobs: totalFormalJobs / totalCities,
    };
};