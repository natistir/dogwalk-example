import * as React from "react";
import { StyleSheet } from "react-nativescript";
import { WeatherData, HeatIndexResult } from '../types/Weather';
import { PawIcon } from './PawIcon';

interface WeatherCardProps {
  weather: WeatherData;
  heatIndex: HeatIndexResult;
  onRefresh: () => void;
}

export function WeatherCard({ weather, heatIndex, onRefresh }: WeatherCardProps) {
  return (
    <stackLayout style={styles.card}>
      <flexboxLayout style={styles.header}>
        <label style={styles.location} text={weather.location} />
        <button style={styles.refreshButton} text="🔄" onTap={onRefresh} />
      </flexboxLayout>
      
      <flexboxLayout style={styles.mainInfo}>
        <stackLayout style={styles.tempSection}>
          <label style={styles.temperature} text={`${weather.temperature}°F`} />
          <label style={styles.humidity} text={`Humidity: ${weather.humidity}%`} />
        </stackLayout>
        
        <PawIcon status={heatIndex.riskLevel} size={80} />
      </flexboxLayout>
      
      <stackLayout style={styles.heatIndexSection}>
        <label style={styles.heatIndexLabel} text="Heat Index" />
        <label style={styles.heatIndexValue} text={`${heatIndex.heatIndex}°F`} />
        <label 
          style={{
            ...styles.statusMessage,
            color: heatIndex.riskLevel === 'safe' ? '#4CAF50' : 
                   heatIndex.riskLevel === 'caution' ? '#FF9800' : '#F44336'
          }} 
          text={heatIndex.message} 
        />
      </stackLayout>
    </stackLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    margin: 16,
    elevation: 4,
  },
  header: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  location: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  refreshButton: {
    fontSize: 20,
    backgroundColor: "transparent",
    color: "#2196F3",
  },
  mainInfo: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  tempSection: {
    alignItems: "flex-start",
  },
  temperature: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#333",
  },
  humidity: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  heatIndexSection: {
    alignItems: "center",
  },
  heatIndexLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  heatIndexValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: "bold",
    textAlignment: "center",
  },
});