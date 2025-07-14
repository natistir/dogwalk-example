import * as React from "react";
import { StyleSheet } from "react-nativescript";
import { RouteProp } from '@react-navigation/core';
import { FrameNavigationProp } from "react-nativescript-navigation";
import { MainStackParamList } from "../NavigationParamList";
import { StorageService } from '../services/StorageService';
import { WalkLog } from '../types/Weather';
import { format } from 'date-fns';
import { ErrorBoundary } from './ErrorBoundary';

type WalkHistoryProps = {
    route: RouteProp<MainStackParamList, "History">,
    navigation: FrameNavigationProp<MainStackParamList, "History">,
};

export function WalkHistoryScreen({ navigation }: WalkHistoryProps) {
  const [walkLogs, setWalkLogs] = React.useState<WalkLog[]>([]);

  React.useEffect(() => {
    loadWalkLogs();
  }, []);

  const loadWalkLogs = () => {
    const logs = StorageService.getWalkLogs();
    setWalkLogs(logs.sort((a, b) => b.date.getTime() - a.date.getTime()));
  };

  const clearHistory = () => {
    StorageService.clearWalkLogs();
    setWalkLogs([]);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe': return '#4CAF50';
      case 'caution': return '#FF9800';
      case 'danger': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe': return '✅';
      case 'caution': return '⚠️';
      case 'danger': return '🚫';
      default: return '❓';
    }
  };

  return (
    <ErrorBoundary>
      <gridLayout rows="auto, *" style={styles.container}>
        <flexboxLayout row={0} style={styles.header}>
          <button 
            style={styles.backButton} 
            text="← Back" 
            onTap={() => navigation.goBack()} 
          />
          <label style={styles.title} text="Walk History" />
          <button 
            style={styles.clearButton} 
            text="Clear" 
            onTap={clearHistory} 
          />
        </flexboxLayout>

        <stackLayout row={1}>
          {walkLogs.length === 0 ? (
            <stackLayout style={styles.emptyState}>
              <label style={styles.emptyIcon} text="📝" />
              <label style={styles.emptyText} text="No walk history yet" />
              <label style={styles.emptySubtext} text="Your completed walks will appear here" />
            </stackLayout>
          ) : (
            <scrollView>
              <stackLayout style={styles.logsList}>
                {walkLogs.map((log) => (
                  <stackLayout key={log.id} style={styles.logItem}>
                    <flexboxLayout style={styles.logHeader}>
                      <stackLayout style={styles.logDate}>
                        <label style={styles.dateText} text={format(log.date, 'MMM dd, yyyy')} />
                        <label style={styles.timeText} text={format(log.date, 'h:mm a')} />
                      </stackLayout>
                      <flexboxLayout style={styles.riskIndicator}>
                        <label style={styles.riskIcon} text={getRiskIcon(log.riskLevel)} />
                        <label 
                          style={{
                            ...styles.riskText,
                            color: getRiskColor(log.riskLevel)
                          }} 
                          text={log.riskLevel.toUpperCase()} 
                        />
                      </flexboxLayout>
                    </flexboxLayout>

                    <flexboxLayout style={styles.logDetails}>
                      <stackLayout style={styles.detailItem}>
                        <label style={styles.detailLabel} text="Temperature" />
                        <label style={styles.detailValue} text={`${log.temperature}°F`} />
                      </stackLayout>
                      <stackLayout style={styles.detailItem}>
                        <label style={styles.detailLabel} text="Heat Index" />
                        <label style={styles.detailValue} text={`${log.heatIndex}°F`} />
                      </stackLayout>
                      {log.surfaceTemp && (
                        <stackLayout style={styles.detailItem}>
                          <label style={styles.detailLabel} text="Surface" />
                          <label style={styles.detailValue} text={`${log.surfaceTemp}°F`} />
                        </stackLayout>
                      )}
                    </flexboxLayout>

                    {log.duration && (
                      <label style={styles.duration} text={`Duration: ${log.duration} minutes`} />
                    )}

                    {log.notes && (
                      <label style={styles.notes} text={log.notes} />
                    )}
                  </stackLayout>
                ))}
              </stackLayout>
            </scrollView>
          )}
        </stackLayout>
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
    backgroundColor: "white",
    elevation: 2,
  },
  backButton: {
    fontSize: 16,
    color: "#2196F3",
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  clearButton: {
    fontSize: 16,
    color: "#F44336",
    backgroundColor: "transparent",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlignment: "center",
  },
  logsList: {
    padding: 16,
  },
  logItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  logHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  logDate: {
    alignItems: "flex-start",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  timeText: {
    fontSize: 14,
    color: "#666",
  },
  riskIndicator: {
    alignItems: "center",
  },
  riskIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  riskText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  logDetails: {
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailItem: {
    alignItems: "center",
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  duration: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});