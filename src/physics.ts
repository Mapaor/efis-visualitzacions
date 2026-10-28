export const K_B_EV = 8.617333262e-5;
export const E_G = 1.12;
export const Q = 1.602176634e-19;
export const NC_300 = 2.8e19;
export const NV_300 = 1.04e19;

export const COLORS = {
  valence: '#4979b8', conduction: '#ef8b32', gap: '#edf1f5',
  electron: '#4979b8', hole: '#d95958', fermi: '#459b78', teal: '#3faaa8',
  purple: '#9270b5', ink: '#182638', muted: '#69788c', grid: '#e7ecf2',
} as const;

export const nc = (temperature: number) => NC_300 * (temperature / 300) ** 1.5;
export const nv = (temperature: number) => NV_300 * (temperature / 300) ** 1.5;
export const intrinsicDensity = (temperature: number) =>
  Math.sqrt(nc(temperature) * nv(temperature)) * Math.exp(-E_G / (2 * K_B_EV * temperature));

export function sample(count: number, from: number, to: number): number[] {
  return Array.from({ length: count }, (_, index) => from + (to - from) * index / (count - 1));
}

export function carrierDensities(temperature: number, donors: number) {
  const intrinsic = intrinsicDensity(temperature);
  const freezeOut = Math.sqrt(nc(temperature) * donors / 2) * Math.exp(-0.045 / (2 * K_B_EV * temperature));
  const extrinsic = donors / 2 + Math.sqrt((donors / 2) ** 2 + intrinsic ** 2);
  const electrons = Math.min(freezeOut, extrinsic);
  return { electrons, holes: intrinsic ** 2 / electrons, intrinsic };
}

export function diodeCurrent(voltage: number, temperature: number, saturation: number) {
  const exponent = Math.min(voltage / (K_B_EV * temperature), 40);
  return saturation * (Math.exp(exponent) - 1);
}

export const format = (value: number, digits = 2) =>
  new Intl.NumberFormat('ca-ES', { maximumFractionDigits: digits }).format(value);
