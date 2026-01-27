/**
 * Types para dados de corridas do N8N
 */

export interface Ride {
  id: string;
  city?: string;
  cityId?: number;
  created_at: Date;
  completed_at?: Date;
  value?: number;
  status?: string;
  distance?: number;
  duration?: number;
  driver_id?: string;
  passenger_id?: string;
}

export interface RideStats {
  cityName: string;
  totalRides: number;
  totalRevenue: number;
  averageValue: number;
  firstRide: Date | null;
  lastRide: Date | null;
  activeMonths: number;
  averageRidesPerDay: number;
  averageRidesPerMonth: number;
}

export interface MonthlyRideData {
  month: string; // YYYY-MM
  year: number;
  monthNumber: number;
  rides: number;
  revenue: number;
  averageValue: number;
  uniqueDays: number;
}

export interface RidesSummary {
  totalRides: number;
  totalRevenue: number;
  citiesWithData: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  topCities: Array<{
    city: string;
    rides: number;
    revenue: number;
  }>;
}

export interface DailyRideData {
  date: string; // YYYY-MM-DD
  rides: number;
  revenue: number;
}

export interface RideFilters {
  startDate?: Date;
  endDate?: Date;
  minValue?: number;
  maxValue?: number;
  status?: string[];
}
