import * as React from "react";
import { StyleSheet } from "react-nativescript";
import { RouteProp } from '@react-navigation/core';
import { FrameNavigationProp } from "react-nativescript-navigation";
import { Dialogs } from '@nativescript/core';
import * as geolocation from '@nativescript/geolocation';
import { MainStackParamList } from "../NavigationParamList";
import { WeatherService } from '../services/WeatherService';
import { StorageService } from '../services/StorageService';
import { WeatherData, HeatIndexResult, WalkLog } from '../types/Weather';
import { WeatherCard } from './WeatherCard';
import { PawCheckModal } from './PawCheckModal';
import { SafeTimesCard } from './SafeTimesCard';
import { ErrorBoundary } from './ErrorBoundary';

type HomeScreenProps = {
    route: RouteProp<MainStackParamList, "Home">,
    navigation: FrameNavigationProp<MainStackParamList, "Home">,
};

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [weather, setWeather] = React.useState<WeatherData | null>(null);
  const [heatIndex, setHeatIndex] = React.useState<HeatIndexResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPawCheck, setShowPawCheck] = React.useState(false);
  const [safeWalkTimes, setSafeWalkTimes] = React.useState<string[]>([]);

  React.useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    setLoading(true);
    try {
      // Check if location is enabled and request permission
      const isEnabled = await geolocation.isEnabled();
      if (!isEnabled) {
        const enableResult = await geolocation.enableLocationRequest();
        if (!enableResult) {
          // Fall back to mock data if location is denied
          console.log('Location permission denied, using mock data');
          const mockWeatherData = await WeatherService.getMockWeatherData();
          const heatIndexResult = WeatherService.calculateHeatIndex(
            mockWeatherData.temperature, 
            mockWeatherData.humidity
          );
          const walkTimes = WeatherService.getSafeWalkTimes(mockWeatherData.temperature);
          
          setWeather(mockWeatherData);
          setHeatIndex(heatIndexResult);
          setSafeWalkTimes(walkTimes.map(time => String(time)));
          
          Dialogs.alert({
            title: "Location Access",
            message: "Using sample weather data. Enable location access in settings for accurate local weather.",
            okButtonText: "OK"
          });
          return;
        }
      }

      try {
        const location = await geolocation.getCurrentLocation({
          desiredAccuracy: 3,
          updateDistance: 10,
          maximumAge: 20000,
          timeout: 20000
        });

        // Get weather data
        const weatherData = await WeatherService.getCurrentWeather(
          location.latitude, 
          location.longitude
        );
        
        const heatIndexResult = WeatherService.calculateHeatIndex(
          weatherData.temperature, 
          weatherData.humidity
        );

        const walkTimes = WeatherService.getSafeWalkTimes(weatherData.temperature);

        setWeather(weatherData);
        setHeatIndex(heatIndexResult);
        setSafeWalkTimes(walkTimes.map(time => String(time)));
      } catch (locationError) {
        console.log('Failed to get location, using mock data:', locationError);
        // Fall back to mock data if location fetch fails
        const mockWeatherData = await WeatherService.getMockWeatherData();
        const heatIndexResult = WeatherService.calculateHeatIndex(
          mockWeatherData.temperature, 
          mockWeatherData.humidity
        );
        const walkTimes = WeatherService.getSafeWalkTimes(mockWeatherData.temperature);
        
        setWeather(mockWeatherData);
        setHeatIndex(heatIndexResult);
        setSafeWalkTimes(walkTimes.map(time => String(time)));
        
        Dialogs.alert({
          title: "Location Unavailable",
          message: "Unable to get your location. Using sample weather data for demonstration.",
          okButtonText: "OK"
        });
      }
      
    } catch (error) {
      console.error('Failed to load weather data:', error);
      Dialogs.alert({
        title: "Error",
        message: "Failed to load weather data. Please try again or check your settings.",
        okButtonText: "OK"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePawCheckResult = (surfaceTemp: number, method: 'timer' | 'thermometer') => {
    setShowPawCheck(false);
    
    const isSafe = surfaceTemp < 125;
    const message = isSafe 
      ? `Surface temperature is ${surfaceTemp}°F - Safe for walking!`
      : `Surface temperature is ${surfaceTemp}°F - Too hot for paws! Wait for cooler conditions.`;

    Dialogs.alert({
      title: isSafe ? "Safe to Walk" : "Too Hot!",
      message,
      okButtonText: "OK"
    });

    // Log the walk attempt
    if (weather && heatIndex) {
      const walkLog: WalkLog = {
        id: Date.now().toString(),
        date: new Date(),
        temperature: weather.temperature,
        heatIndex: heatIndex.heatIndex,
        surfaceTemp,
        riskLevel: isSafe ? (heatIndex.riskLevel === 'danger' ? 'caution' : heatIndex.riskLevel) : 'danger',
      };
      
      StorageService.saveWalkLog(walkLog);
    }
  };

  const startWalk = () => {
    if (!weather || !heatIndex) return;

    if (heatIndex.riskLevel === 'danger') {
      Dialogs.confirm({
        title: "Dangerous Conditions",
        message: "Current conditions are dangerous for walking. Are you sure you want to continue?",
        okButtonText: "Continue",
        cancelButtonText: "Cancel"
      }).then((result) => {
        if (result) {
          setShowPawCheck(true);
        }
      });
    } else {
      setShowPawCheck(true);
    }
  };

  return (
    <ErrorBoundary>
      <gridLayout rows="auto, *" style={styles.container}>
        <flexboxLayout row={0} style={styles.header}>
          <stackLayout style={styles.titleSection}>
            <label style={styles.appTitle} text="🐕 DogWalk Safety" />
            <label style={styles.subtitle} text="Keep your pup safe!" />
          </stackLayout>
          <button 
            style={styles.historyButton} 
            text="📋"
            onTap={() => navigation.navigate("History")} 
          />
        </flexboxLayout>

        <stackLayout row={1} style={styles.mainContent}>
          {loading ? (
            <stackLayout style={styles.loadingContainer}>
              <label style={styles.loadingText} text="Loading weather data..." />
            </stackLayout>
          ) : weather && heatIndex ? (
            <scrollView>
              <stackLayout style={styles.content}>
                <WeatherCard 
                  weather={weather} 
                  heatIndex={heatIndex} 
                  onRefresh={loadWeatherData}
                />
                
                <SafeTimesCard suggestions={safeWalkTimes} />
                
                <stackLayout style={styles.actionButtons}>
                  <button 
                    style={styles.pawCheckButton}
                    text="🐾 Paw Check"
                    onTap={startWalk}
                  />
                  <label style={styles.pawCheckHint} 
                    text="Test surface temperature before walking" 
                  />
                </stackLayout>
              </stackLayout>
            </scrollView>
          ) : (
            <stackLayout style={styles.errorContainer}>
              <label style={styles.errorText} text="Unable to load weather data" />
              <button 
                style={styles.retryButton}
                text="Retry"
                onTap={loadWeatherData}
              />
            </stackLayout>
          )}
        </stackLayout>

        <PawCheckModal 
          isVisible={showPawCheck}
          onClose={() => setShowPawCheck(false)}
          onResult={handlePawCheckResult}
        />
      </gridLayout>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F5F5",
  },
  header: {
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    backgroundColor: "#2196F3",
  },
  titleSection: {
    alignItems: "flex-start",
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  historyButton: {
    fontSize: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "white",
    borderRadius: 8,
    padding: 8,
  },
  mainContent: {
    backgroundColor: "#F5F5F5",
  },
  content: {
    paddingBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
    textAlignment: "center",
  },
  retryButton: {
    backgroundColor: "#2196F3",
    color: "white",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  actionButtons: {
    alignItems: "center",
    margin: 16,
  },
  pawCheckButton: {
    backgroundColor: "#4CAF50",
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    padding: 16,
    borderRadius: 12,
    width: "80%",
    marginBottom: 8,
  },
  pawCheckHint: {
    fontSize: 14,
    color: "#666",
    textAlignment: "center",
  },
});
