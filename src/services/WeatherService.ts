import { ApplicationSettings } from "@nativescript/core";
import { WeatherData, HeatIndexResult } from "../types/Weather";

// IMPORTANT: Replace with your actual OpenWeatherMap API key
const API_KEY = "92c7312cf5954f1e7e3252bf3e62fa0b";

/**
 * A helper function to fetch weather data from a given URL and parse it.
 * This avoids code duplication between fetching by geo-coordinates and by zip code.
 * @param url The OpenWeatherMap API URL to fetch from.
 * @returns A promise that resolves to the WeatherData object.
 */
async function fetchAndParseWeather(url: string): Promise<WeatherData> {
    const response = await fetch(url);
    if (!response.ok) {
        const error = await response.json();
        // Provide a more descriptive error message from the API if available
        throw new Error(error.message || "Failed to fetch weather data");
    }
    const data = await response.json();
    
    // Map the API response to our app's WeatherData structure
    return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        description: data.weather[0].description,
        location: data.name,
        icon: data.weather[0].icon,
    };
}

export const WeatherService = {
    /**
     * Fetches the current weather for a given latitude and longitude.
     */
    getCurrentWeather: async (latitude: number, longitude: number): Promise<WeatherData> => {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=imperial`;
        return fetchAndParseWeather(url);
    },

    /**
     * NEW: Fetches the current weather for a given US zip code.
     */
    getWeatherByZipCode: async (zipCode: string): Promise<WeatherData> => {
        const url = `https://api.openweathermap.org/data/2.5/weather?zip=${zipCode},us&appid=${API_KEY}&units=imperial`;
        return fetchAndParseWeather(url);
    },
    
    /**
     * Provides mock weather data for testing or when location services are unavailable.
     */
    getMockWeatherData: async (): Promise<WeatherData> => {
        console.log("Using mock weather data.");
        return {
            temperature: 95,
            humidity: 70,
            description: "Sunny",
            location: "Mockville, USA",
            icon: "01d",
        };
    },

    /**
     * Calculates the heat index and provides a corresponding risk level and advice.
     */
    calculateHeatIndex: (temperature: number, humidity: number): HeatIndexResult => {
        const T = temperature;
        const RH = humidity;
        
        // Steadman's formula for heat index calculation
        let heatIndex = -42.379 + 2.04901523*T + 10.14333127*RH - 0.22475541*T*RH - 6.83783e-3*T*T - 5.481717e-2*RH*RH + 1.22874e-3*T*T*RH + 8.5282e-4*T*RH*RH - 1.99e-6*T*T*RH*RH;

        // Adjustment for lower temperatures
        if (T < 80) {
            heatIndex = 0.5 * (T + 61.0 + ((T-68.0)*1.2) + (RH*0.094));
        }

        let riskLevel: 'low' | 'caution' | 'danger' | 'extreme' = 'low';
        let advice = "It's a great day for a walk!";

        if (heatIndex >= 125) {
            riskLevel = 'extreme';
            advice = "Extreme danger: Heatstroke highly likely. Avoid outdoor activity.";
        } else if (heatIndex >= 103) {
            riskLevel = 'danger';
            advice = "Danger: Heatstroke, cramps, or exhaustion likely. Limit outdoor time.";
        } else if (heatIndex >= 90) {
            riskLevel = 'caution';
            advice = "Caution: Fatigue possible with prolonged exposure. Take breaks.";
        }
        
        return {
            heatIndex: Math.round(heatIndex),
            riskLevel,
            advice,
        };
    },

    /**
     * Provides suggestions for safe walking times based on the air temperature.
     */
    getSafeWalkTimes: (temperature: number): string[] => {
        if (temperature < 80) {
            return ["Anytime is a good time for a walk!"];
        }
        if (temperature >= 80 && temperature < 85) {
            return ["Early morning (before 10 AM)", "Late evening (after 7 PM)"];
        }
        if (temperature >= 85 && temperature < 95) {
            return ["Very early morning (before 8 AM)", "Very late evening (after 8 PM)"];
        }
        return ["Consider indoor activities today.", "If you must walk, go before sunrise or after sunset."];
    },
};
