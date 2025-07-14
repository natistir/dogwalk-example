import * as React from "react";
import { StyleSheet } from "react-nativescript";

interface SafeTimesCardProps {
  suggestions: string[];
}

export function SafeTimesCard({ suggestions }: SafeTimesCardProps) {
  return (
    <stackLayout style={styles.card}>
      <label style={styles.title} text="🕐 Safe Walk Times" />
      <stackLayout style={styles.suggestionsList}>
        {suggestions.map((suggestion, index) => (
          <flexboxLayout key={index} style={styles.suggestionItem}>
            <label style={styles.bullet} text="•" />
            <label style={styles.suggestionText} text={suggestion || ''} />
          </flexboxLayout>
        ))}
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
    marginTop: 0,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  suggestionsList: {
    // No specific styles needed
  },
  suggestionItem: {
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: "#2196F3",
    marginRight: 8,
    width: 20,
  },
  suggestionText: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
});