export type Spin = 1 | -1;

export interface SimulationStats {
  magnetization: number;
  energy: number;
  domainData: { size: number; count: number }[];
}

export interface SimulationConfig {
  size: number;
  temperature: number; // In units of J/k_B
}

export const CRITICAL_TEMPERATURE = 2.269; // Onsager solution approx