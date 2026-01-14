import { City } from '../types';
import { PENETRATION_SCENARIOS, PRICE_PER_RIDE } from '../constants';

export const calculatePotentialRevenue = (city: City, scenario: keyof typeof PENETRATION_SCENARIOS = 'Média'): number => {
    if (!city) return 0;
    const penetrationRate = PENETRATION_SCENARIOS[scenario];
    const potentialRides = city.population15to44 * penetrationRate;
    return potentialRides * PRICE_PER_RIDE;
};

export const getFinancialProjections = (city: City) => {
    return Object.entries(PENETRATION_SCENARIOS).map(([scenario, rate]) => {
        return {
            scenario,
            revenue: (city.population15to44 * rate) * PRICE_PER_RIDE
        };
    });
};

export const getMarketPotential = (city: City) => {
    return Object.entries(PENETRATION_SCENARIOS).map(([scenario, rate]) => {
        return {
            scenario,
            rides: city.population15to44 * rate
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
            rides: city.population15to44 * rate
        };
    });
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

    const totalIncome = cities.reduce((acc, city) => acc + city.averageIncome, 0);
    const totalPopulation = cities.reduce((acc, city) => acc + city.population, 0);
    const totalPopulation15to44 = cities.reduce((acc, city) => acc + city.population15to44, 0);
    const totalTargetAudiencePercentage = cities.reduce((acc, city) => {
        const percentage = city.population > 0 ? city.population15to44 / city.population : 0;
        return acc + percentage;
    }, 0);
    const totalFormalSalary = cities.reduce((acc, city) => acc + city.averageFormalSalary, 0);
    const totalFormalJobs = cities.reduce((acc, city) => acc + city.formalJobs, 0);

    return {
        averageIncome: totalIncome / totalCities,
        averagePopulation: totalPopulation / totalCities,
        averagePopulation15to44: totalPopulation15to44 / totalCities,
        averageTargetAudiencePercentage: (totalTargetAudiencePercentage / totalCities),
        averageFormalSalary: totalFormalSalary / totalCities,
        averageFormalJobs: totalFormalJobs / totalCities,
    };
};