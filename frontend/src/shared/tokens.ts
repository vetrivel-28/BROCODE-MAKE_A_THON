// LoopDesk Design Tokens
// Used across shared UI components and feature modules

export const colors = {
  background: "#F7F8FC",
  surface: "#FFFFFF",
  text: "#1B1F3B",
  textMuted: "#6B7280",
  border: "#E9EAF2",
  primary: "#6C4BFF",
  primaryHover: "#5A3BE6",
  primaryLight: "#F0EDFF",
  accent: "#00C2A8",
  accentHover: "#00A892",
  accentLight: "#E6FAF6",
  warm: "#FF7A59",
  warmHover: "#E66847",
  warmLight: "#FFF0EB",
  highlight: "#FFC93C",
  highlightLight: "#FFF8E6",
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
} as const;

export const radii = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  full: "9999px",
} as const;

export const shadows = {
  soft: "0 4px 20px -2px rgba(27, 31, 59, 0.05), 0 2px 6px -1px rgba(27, 31, 59, 0.03)",
  card: "0 10px 30px -4px rgba(108, 75, 255, 0.06), 0 4px 10px -2px rgba(27, 31, 59, 0.04)",
  dropdown: "0 20px 40px -6px rgba(27, 31, 59, 0.12), 0 8px 16px -4px rgba(27, 31, 59, 0.06)",
} as const;
