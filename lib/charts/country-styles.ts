import type { CountryCode } from "../catalog/countries";

export const countryChartStyles: Record<CountryCode, { color: string; dash: "solid" | "dashed" | "dotted" }> = {
  CN: { color: "#0284c7", dash: "solid" },
  US: { color: "#7c3aed", dash: "solid" },
  JP: { color: "#dc2626", dash: "dashed" },
  DE: { color: "#d97706", dash: "solid" },
  IN: { color: "#16a34a", dash: "dashed" },
  GB: { color: "#db2777", dash: "dotted" },
  FR: { color: "#0891b2", dash: "dashed" },
  KR: { color: "#475569", dash: "dotted" },
};
