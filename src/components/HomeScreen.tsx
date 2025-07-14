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
    
    // NEW: State for zip code input and tracking the last fetch method.
    const [zipCode, setZipCode] = React.useState("");
    const [lastFetchMethod, setLastFetchMethod] = React.useState<'geo' | 'zip' | null>(null);

    /**
     * A centralized function to process weather data once it's fetched.
     * This avoids duplicating state update logic.
     * @param data The fetched WeatherData object.
     */
    const processWeatherData = (data: WeatherData) => {
        const heatIndexResult = WeatherService.calculateHeatIndex(
            data.temperature, 
            data.humidity
        );
        const walkTimes = WeatherService.getSafeWalkTimes(data.temperature);
        
        setWeather(data);
        setHeatIndex(heatIndexResult);
        
        const sanitizedWalkTimes = Array.isArray(walkTimes)
            ? walkTimes.filter(time => time != null).map(time => String(time))
            : [];
        setSafeWalkTimes(sanitizedWalkTimes);
    };

    /**
     * Fetches weather data using the device's geolocation.
     */
    const loadWeatherByLocation = async () => {
        setLoading(true);
        try {
            const isEnabled = await geolocation.isEnabled();
            if (!isEnabled) {
                const enabled = await geolocation.enableLocationRequest();
                if (!enabled) {
                    Dialogs.alert({ title: "Location Denied", message: "Location services are required for this feature. You can use a zip code instead.", okButtonText: "OK"});
                    setLoading(false);
                    return;
                }
            }
            
            const location = await geolocation.getCurrentLocation({
                desiredAccuracy: 3,
                timeout: 20000
            });
            const weatherData = await WeatherService.getCurrentWeather(location.latitude, location.longitude);
            processWeatherData(weatherData);
            setLastFetchMethod('geo');
        } catch (error) {
            console.error('Error getting weather by location:', error);
            Dialogs.alert({ title: "Location Error", message: "Could not get your location. Please try again or use a zip code.", okButtonText: "OK"});
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetches weather data using the provided zip code.
     */
    const loadWeatherByZip = async () => {
        if (!/^\d{5}$/.test(zipCode)) {
            Dialogs.alert({ title: "Invalid Zip Code", message: "Please enter a valid 5-digit zip code.", okButtonText: "OK" });
            return;
        }
        setLoading(true);
        try {
            const weatherData = await WeatherService.getWeatherByZipCode(zipCode);
            processWeatherData(weatherData);
            setLastFetchMethod('zip');
        } catch (error) {
            console.error('Error getting weather by zip:', error);
            Dialogs.alert({ title: "Weather Error", message: `Could not find weather for zip code ${zipCode}. Please check the number and try again.`, okButtonText: "OK" });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles the refresh action, using the last successful fetch method.
     */
    const handleRefresh = () => {
        if (lastFetchMethod === 'geo') {
            loadWeatherByLocation();
        } else if (lastFetchMethod === 'zip') {
            loadWeatherByZip();
        }
    };

    const handlePawCheckResult = (surfaceTemp: number, method: 'timer' | 'thermometer') => {
        setShowPawCheck(false);
        const isSafe = surfaceTemp < 125;
        const message = isSafe 
            ? `Surface temperature is ${surfaceTemp}°F - Safe for walking!`
            : `Surface temperature is ${surfaceTemp}°F - Too hot for paws! Wait for cooler conditions.`;

        Dialogs.alert({ title: isSafe ? "Safe to Walk" : "Too Hot!", message, okButtonText: "OK" });

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
                if (result) setShowPawCheck(true);
            });
        } else {
            setShowPawCheck(true);
        }
    };

    /**
     * Renders the initial form for the user to select their weather source.
     */
    const renderInputForm = () => (
        <stackLayout style={styles.inputContainer}>
            <label style={styles.inputLabel} text="Enter Zip Code" />
            <textField 
                style={styles.textField}
                hint="e.g., 90210"
                keyboardType="number"
                maxLength={5}
                text={zipCode}
                onTextChange={(args) => setZipCode(args.value)}
            />
            <button style={styles.actionButton} text="Get Weather by Zip" onTap={loadWeatherByZip} />
            
            <label style={styles.orLabel} text="OR" />

            <button style={styles.actionButton} text="Use My Current Location" onTap={loadWeatherByLocation} />
        </stackLayout>
    );

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
                            <label style={styles.loadingText} text="Fetching weather data..." />
                        </stackLayout>
                    ) : weather && heatIndex ? (
                        <scrollView>
                            <stackLayout style={styles.content}>
                                <WeatherCard 
                                    weather={weather} 
                                    heatIndex={heatIndex} 
                                    onRefresh={handleRefresh}
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
                        renderInputForm()
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
    container: { backgroundColor: "#F5F5F5" },
    header: {
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        paddingTop: 40,
        backgroundColor: "#2196F3",
    },
    titleSection: { alignItems: "flex-start" },
    appTitle: { fontSize: 24, fontWeight: "bold", color: "white" },
    subtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 2 },
    historyButton: {
        fontSize: 24,
        backgroundColor: "rgba(255,255,255,0.2)",
        color: "white",
        borderRadius: 8,
        padding: 8,
    },
    mainContent: { backgroundColor: "#F5F5F5" },
    content: { paddingBottom: 20 },
    loadingContainer: { alignItems: "center", justifyContent: "center", padding: 40 },
    loadingText: { fontSize: 16, color: "#666" },
    actionButtons: { alignItems: "center", margin: 16 },
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
    pawCheckHint: { fontSize: 14, color: "#666", textAlignment: "center" },
    // NEW STYLES for the input form
    inputContainer: {
        margin: 20,
        marginTop: 40,
        padding: 20,
        backgroundColor: "white",
        borderRadius: 12,
        alignItems: "center",
        elevation: 4,
    },
    inputLabel: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 16,
    },
    textField: {
        width: "80%",
        fontSize: 18,
        padding: 10,
        borderBottomWidth: 2,
        borderColor: "#DDD",
        marginBottom: 20,
        textAlignment: "center",
    },
    actionButton: {
        backgroundColor: "#2196F3",
        color: "white",
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        width: "90%",
    },
    orLabel: {
        fontSize: 16,
        color: "#999",
        margin: 20,
    },
});
