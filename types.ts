
export enum CityStatus {
  Consolidated = 'Consolidada',
  Expansion = 'Em expansão',
  NotServed = 'Não atendida',
  Planning = 'Planejamento',
}

export enum Mesorregion {
  NORTE_MATOGROSSENSE = 'NORTE_MATOGROSSENSE',
  NORDESTE_MATOGROSSENSE = 'NORDESTE_MATOGROSSENSE',
  CENTRO_SUL_MATOGROSSENSE = 'CENTRO_SUL_MATOGROSSENSE',
  SUDESTE_MATOGROSSENSE = 'SUDESTE_MATOGROSSENSE',
  SUDOESTE_MATOGROSSENSE = 'SUDOESTE_MATOGROSSENSE',
}

export interface City {
  id: number;
  name: string;
  population: number;
  population15to44: number;
  averageIncome: number;
  urbanizationIndex: number;
  status: CityStatus;
  mesorregion: Mesorregion;
  gentilic: string;
  anniversary: string;
  mayor: string;
  monthlyRevenue?: number;
  implementationStartDate?: string;
  averageFormalSalary: number;
  formalJobs: number;
  urbanizedAreaKm2: number;
}

export enum ChatMessageSender {
    User = 'user',
    AI = 'ai',
}

export interface ChatMessage {
    id: string;
    sender: ChatMessageSender;
    text: string;
    isLoading?: boolean;
}

// --- Tipos para o Sistema de Planejamento ---

export interface Tag {
    id: string;
    label: string;
    color: string; // Hex code
}

export interface Responsible {
    id: string;
    name: string;
    color: string; // Hex code for avatar background
    initials: string;
}

export interface PlanningAction {
  id: string;
  description: string;
  completed: boolean;
  createdAt: string; // ISO Date String
  estimatedCompletionDate?: string; // ISO Date String
  driveLink?: string; // Link para Google Drive ou documentos
  tagIds?: string[]; // IDs das etiquetas associadas
  responsibleId?: string; // ID do responsável
}

export interface PlanningPhase {
  name: string;
  actions: PlanningAction[];
  completionDate?: string;
  startDate?: string; // ISO Date String
  estimatedCompletionDate?: string; // ISO Date String
}

export interface MonthResult {
    rides: number;
    marketingCost: number;
    operationalCost: number;
    // New projected fields
    projectedMarketing?: number;
    projectedOperational?: number;
}

export interface CityPlan {
  cityId: number;
  startDate: string; // "YYYY-MM"
  phases: PlanningPhase[];
  results?: { [monthKey: string]: MonthResult }; // e.g., { "Mes1": { rides: 1200, marketingCost: 500, ... } }
}

// --- Tipos para Configuração (Settings) ---

export interface PhaseTemplate {
    name: string;
    durationDays: number;
    actions: string[]; // Apenas as descrições das ações padrão
}

// --- Tipos para Inteligência de Mercado ---

export interface MarketBlock {
    id: string;
    name: string;
    cityIds: number[];
}

export interface MarketCompetitor {
    id: string;
    name: string;
    priceLevel: 'Baixo' | 'Médio' | 'Alto';
    strengths: string;
    weaknesses: string;
    marketShareEstimate?: number; // 0-100
}

export interface StakeholderContact {
    id: string;
    name: string;
    role: string;
    organization: string;
    phone: string;
    email?: string;
    category: 'Governo' | 'Mídia' | 'Parceiro' | 'Influenciador' | 'Outro';
    status: 'A Contatar' | 'Em Negociação' | 'Parceria Firmada';
}

export interface SWOTAnalysis {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
}

export interface CityMarketData {
    cityId: number;
    economicNotes: string; // Texto livre sobre economia/indústria/resumo
    mediaChannelsNotes: string; // Rádios, Jornais, Outdoor
    cityHallPhone?: string; // Telefone geral da prefeitura
    cityHallEmail?: string; // Email geral da prefeitura
    competitors: MarketCompetitor[];
    stakeholders: StakeholderContact[];
    swot: SWOTAnalysis;
    updatedAt: string;
}
