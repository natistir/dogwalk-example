import { WeatherData, HeatIndexResult } from '../types/Weather';

  async getMockWeatherData(): Promise<WeatherData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      temperature: 78,
      humidity: 65,
      condition: 'Partly Cloudy',
      location: 'Sample Location',
      timestamp: new Date()
    };
  },

export class WeatherService {
  private static readonly API_KEY = 'demo'; // In production, use a real API key
  
  static async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    try {
      // Simulated weather data for demo purposes
      // In production, use a real weather API like OpenWeatherMap
      const mockWeather: WeatherData = {
        temperature: Math.floor(Math.random() * 30) + 70, // 70-100°F
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        condition: 'sunny',
        location: 'Current Location',
        timestamp: new Date()
      };
      
      return mockWeather;
    } catch (error) {
      throw new Error('Failed to fetch weather data');
    }
  }
  
  static calculateHeatIndex(temperature: number, humidity: number): HeatIndexResult {
    // Heat index calculation using the formula
    const T = temperature;
    const RH = humidity;
    
    let HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (RH * 0.094));
    
    if (HI >= 80) {
      HI = -42.379 + 2.04901523 * T + 10.14333127 * RH - 0.22475541 * T * RH
        - 0.00683783 * T * T - 0.05481717 * RH * RH + 0.00122874 * T * T * RH
        + 0.00085282 * T * RH * RH - 0.00000199 * T * T * RH * RH;
    }
    
    let riskLevel: 'safe' | 'caution' | 'danger';
    let message: string;
    
    if (HI < 80) {
      riskLevel = 'safe';
      message = 'Safe for walking';
    } else if (HI < 90) {
      riskLevel = 'caution';
      message = 'Use caution - watch for signs of overheating';
    } else {
      riskLevel = 'danger';
      message = 'Dangerous conditions - avoid walking';
    }
    
    return {
      heatIndex: Math.round(HI),
      riskLevel,
      message
    };
  }
  
  static getSafeWalkTimes(temperature: number): string[] {
    const suggestions: string[] = [];
    
    if (temperature > 85) {
      suggestions.push('Early morning (5:00 AM - 7:00 AM)');
      suggestions.push('Late evening (8:00 PM - 10:00 PM)');
    } else if (temperature > 75) {
      suggestions.push('Morning (6:00 AM - 9:00 AM)');
      suggestions.push('Evening (7:00 PM - 9:00 PM)');
    } else {
      suggestions.push('Anytime during daylight hours');
    }
    
    return suggestions;
  }
}