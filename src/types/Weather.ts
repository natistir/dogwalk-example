export interface WeatherData {
  temperature: number;
  humidity: number;
  condition: string;
  location: string;
  timestamp: Date;
}

export interface HeatIndexResult {
  heatIndex: number;
  riskLevel: 'safe' | 'caution' | 'danger';
  message: string;
}

export interface WalkLog {
  id: string;
  date: Date;
  temperature: number;
  heatIndex: number;
  surfaceTemp?: number;
  duration?: number;
  notes?: string;
  riskLevel: 'safe' | 'caution' | 'danger';
}

export interface SafeWalkTime {
  time: string;
  temperature: number;
  recommended: boolean;
}