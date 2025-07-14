import * as React from "react";
import { StyleSheet } from "react-nativescript";

interface PawCheckModalProps {
  isVisible: boolean;
  onClose: () => void;
  onResult: (surfaceTemp: number, method: 'timer' | 'thermometer') => void;
}

export function PawCheckModal({ isVisible, onClose, onResult }: PawCheckModalProps) {
  const [method, setMethod] = React.useState<'timer' | 'thermometer'>('timer');
  const [timerCount, setTimerCount] = React.useState(0);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [manualTemp, setManualTemp] = React.useState('');
  
  React.useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerCount < 7) {
      interval = setInterval(() => {
        setTimerCount(prev => {
          if (prev >= 6) {
            setIsTimerRunning(false);
            // If user can hold for 7 seconds, surface is likely safe (under 125°F)
            onResult(120, 'timer');
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerCount]);

  const startTimer = () => {
    setTimerCount(0);
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    // If stopped before 7 seconds, surface is too hot
    onResult(130, 'timer');
    setTimerCount(0);
  };

  const submitManualTemp = () => {
    const temp = parseFloat(manualTemp);
    if (!isNaN(temp)) {
      onResult(temp, 'thermometer');
      setManualTemp('');
    }
  };

  if (!isVisible) return null;

  return (
    <gridLayout style={styles.overlay}>
      <stackLayout style={styles.modal}>
        <flexboxLayout style={styles.header}>
          <label style={styles.title} text="Paw Check" />
          <button style={styles.closeButton} text="✕" onTap={onClose} />
        </flexboxLayout>

        <stackLayout style={styles.methodSelector}>
          <button 
            style={method === 'timer' ? styles.activeMethod : styles.inactiveMethod}
            text="7-Second Test"
            onTap={() => setMethod('timer')}
          />
          <button 
            style={method === 'thermometer' ? styles.activeMethod : styles.inactiveMethod}
            text="Thermometer"
            onTap={() => setMethod('thermometer')}
          />
        </stackLayout>

        {method === 'timer' ? (
          <stackLayout style={styles.timerSection}>
            <label style={styles.instruction} 
              text="Place the back of your hand on the pavement. If you can't hold it for 7 seconds, it's too hot for your dog's paws." 
            />
            <label style={styles.timerDisplay} text={`${timerCount}/7`} />
            <button 
              style={isTimerRunning ? styles.stopButton : styles.startButton}
              text={isTimerRunning ? "Too Hot! Stop" : "Start Test"}
              onTap={isTimerRunning ? stopTimer : startTimer}
            />
          </stackLayout>
        ) : (
          <stackLayout style={styles.thermometerSection}>
            <label style={styles.instruction} 
              text="Use an infrared thermometer to measure the surface temperature." 
            />
            <textField 
              style={styles.tempInput}
              hint="Enter temperature (°F)"
              keyboardType="number"
              text={manualTemp}
              onTextChange={(args) => setManualTemp(args.value)}
            />
            <button 
              style={styles.submitButton}
              text="Submit Reading"
              onTap={submitManualTemp}
            />
          </stackLayout>
        )}
      </stackLayout>
    </gridLayout>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 12,
    margin: 20,
    padding: 20,
    verticalAlignment: "middle",
  },
  header: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    fontSize: 18,
    backgroundColor: "transparent",
    color: "#666",
  },
  methodSelector: {
    orientation: "horizontal",
    marginBottom: 20,
  },
  activeMethod: {
    backgroundColor: "#2196F3",
    color: "white",
    padding: 12,
    borderRadius: 8,
    margin: 4,
    flex: 1,
  },
  inactiveMethod: {
    backgroundColor: "#E0E0E0",
    color: "#666",
    padding: 12,
    borderRadius: 8,
    margin: 4,
    flex: 1,
  },
  timerSection: {
    alignItems: "center",
  },
  instruction: {
    fontSize: 14,
    color: "#666",
    textAlignment: "center",
    marginBottom: 20,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: "#4CAF50",
    color: "white",
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
  },
  stopButton: {
    backgroundColor: "#F44336",
    color: "white",
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
  },
  thermometerSection: {
    alignItems: "center",
  },
  tempInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: "100%",
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: "#2196F3",
    color: "white",
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
  },
});