
export const MT_UF_CODE = 51;

export const STATUSES = ['Não atendida', 'Em expansão', 'Consolidada', 'Planejamento'];

export const PENETRATION_SCENARIOS = {
    'Muito Baixa': 0.02,
    'Baixa': 0.05,
    'Média': 0.10,
    'Alta': 0.15,
    'Muito Alta': 0.20,
};

export const PRICE_PER_RIDE = 2.50;

// Constantes de custos (percentuais sobre receita)
export const MARKETING_COST_PERCENT = 0.15;    // 15% da receita para marketing
export const OPERATIONAL_COST_PERCENT = 0.35;  // 35% da receita para operacional
export const TOTAL_COST_PERCENT = 0.50;        // 50% total (15% + 35%)

// Curva de graduação dos 6 meses de implementação
export const IMPLEMENTATION_CURVE_FACTORS = [0.045, 0.09, 0.18, 0.36, 0.63, 1.0];

export const MONTHS = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
];

export const chartColors = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899'];

export const PHASE_COLORS: { [key: string]: { bg: string; borderL: string; } } = {
    'Análise & Viabilidade':        { bg: 'bg-blue-500',    borderL: 'border-l-blue-500' },
    'Preparação Operacional':       { bg: 'bg-blue-500',    borderL: 'border-l-blue-500' },
    'Aquisição de Motoristas':      { bg: 'bg-yellow-500',  borderL: 'border-l-yellow-500' },
    'Marketing & Lançamento':       { bg: 'bg-yellow-500',  borderL: 'border-l-yellow-500' },
    'Aquisição de Passageiros':     { bg: 'bg-yellow-500',  borderL: 'border-l-yellow-500' },
    'Pós-Lançamento & Otimização':  { bg: 'bg-green-500',   borderL: 'border-l-green-500' },
};
