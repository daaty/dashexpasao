export enum CityStatus {
  CONSOLIDATED = 'Consolidada',
  EXPANSION = 'Em expansão',
  NOT_SERVED = 'Não atendida',
  PLANNING = 'Planejamento',
}

export enum Mesorregion {
  NORTE_MATOGROSSENSE = 'Norte Mato-grossense',
  NORDESTE_MATOGROSSENSE = 'Nordeste Mato-grossense',
  CENTRO_SUL_MATOGROSSENSE = 'Centro-Sul Mato-grossense',
  SUDESTE_MATOGROSSENSE = 'Sudeste Mato-grossense',
  SUDOESTE_MATOGROSSENSE = 'Sudoeste Mato-grossense',
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
  implementationStartDate?: Date;
  averageFormalSalary: number;
  formalJobs: number;
  urbanizedAreaKm2: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
