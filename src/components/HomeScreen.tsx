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
      // Request location permission and get current location
      const hasPermission = await geolocation.enableLocationRequest();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

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
      setSafeWalkTimes(walkTimes);
    } catch (error) {
      console.error('Failed to load weather data:', error);
      Dialogs.alert({
        title: "Error",
        message: "Failed to load weather data. Please check your location settings and try again.",
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
    <stackLayout style={styles.container}>
      <flexboxLayout style={styles.header}>
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

      <scrollView style={styles.scrollView}>
        <stackLayout style={styles.content}>
          {loading ? (
            <stackLayout style={styles.loadingContainer}>
              <label style={styles.loadingText} text="Loading weather data..." />
            </stackLayout>
          ) : weather && heatIndex ? (
            <>
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
            </>
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
      </scrollView>

      <PawCheckModal 
        isVisible={showPawCheck}
        onClose={() => setShowPawCheck(false)}
        onResult={handlePawCheckResult}
      />
    </stackLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
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
  scrollView: {
    flex: 1,
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