/**
 * Color constants for HTML report styling
 */

// Primary colors
export const COLORS = {
  // Background gradients
  BACKGROUND: {
    PRIMARY_START: "#667eea",
    PRIMARY_END: "#764ba2",
  },

  // Text colors
  TEXT: {
    WHITE: "white",
    PRIMARY: "#333",
    SECONDARY: "#666",
    MUTED: "#4a5568",
    LIGHT: "rgba(255,255,255,0.9)",
    LIGHTER: "rgba(255,255,255,0.8)",
  },

  // Status colors
  STATUS: {
    SUCCESS: "#48bb78",
    ERROR: "#f56565",
    NEUTRAL: "#718096",
    INFO: "#667eea",
    WARNING: "#a0aec0",
  },

  // Badge colors
  BADGE: {
    DEFAULT_BG: "#e9ecef",
    DEFAULT_TEXT: "#495057",
    IN_RANGE_BG: "#d4edda",
    IN_RANGE_TEXT: "#155724",
    OUT_RANGE_BG: "#f8d7da",
    OUT_RANGE_TEXT: "#721c24",
  },
  
  // Chain-specific colors
  CHAIN: {
    ARBITRUM: {
      BG: "#f0f9ff",
      TEXT: "#213147",
      BORDER: "#21314720",
    },
    ETHEREUM: {
      BG: "#f5f5ff",
      TEXT: "#627EEA",
      BORDER: "#627EEA20",
    },
  },

  // Border colors
  BORDER: {
    LIGHT: "#f0f0f0",
    DEFAULT: "#e2e8f0",
  },

  // Background colors
  BACKGROUND_SOLID: {
    WHITE: "white",
    HEADER: "#f7f8fa",
    HOVER: "#f8f9fa",
    GRADIENT_START: "#f8f9fa",
    GRADIENT_END: "#ffffff",
  },

  // Indicator backgrounds (with transparency)
  INDICATOR_BG: {
    SUCCESS: "rgba(72, 187, 120, 0.1)",
    INFO: "rgba(102, 126, 234, 0.1)",
    ERROR: "rgba(245, 101, 101, 0.1)",
    WARNING: "rgba(160, 174, 192, 0.1)",
  },

  // Shadow colors
  SHADOW: {
    DEFAULT: "rgba(0,0,0,0.2)",
    CARD: "0 10px 30px rgba(0,0,0,0.2)",
    TEXT: "2px 2px 4px rgba(0,0,0,0.2)",
  },

  // Discord embed colors (hex integers)
  DISCORD: {
    SUCCESS: 0x4caf50, // Green
    ERROR: 0xf44336, // Red
    INFO: 0x1e88e5, // Blue
    WARNING: 0xffa000, // Orange
  },
} as const;

export type Colors = typeof COLORS;