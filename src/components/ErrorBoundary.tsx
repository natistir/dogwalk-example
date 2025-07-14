import * as React from "react";
import { StyleSheet } from "react-nativescript";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <stackLayout style={styles.errorContainer}>
          <label style={styles.errorIcon} text="⚠️" />
          <label style={styles.errorTitle} text="Something went wrong" />
          <label style={styles.errorMessage} text="Please restart the app" />
          <button 
            style={styles.retryButton}
            text="Retry"
            onTap={() => this.setState({ hasError: false, error: undefined })}
          />
        </stackLayout>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlignment: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlignment: "center",
  },
  retryButton: {
    backgroundColor: "#2196F3",
    color: "white",
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
  },
});