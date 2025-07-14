import * as React from "react";
import { StyleSheet } from "react-nativescript";

interface PawIconProps {
  status: 'safe' | 'caution' | 'danger';
  size?: number;
}

export function PawIcon({ status, size = 60 }: PawIconProps) {
  const getColor = () => {
    switch (status) {
      case 'safe': return '#4CAF50';
      case 'caution': return '#FF9800';
      case 'danger': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <label 
      style={{
        ...styles.pawIcon,
        color: getColor(),
        fontSize: size,
      }}
      text="🐾"
    />
  );
}

const styles = StyleSheet.create({
  pawIcon: {
    textAlignment: "center",
    fontWeight: "bold",
  },
});