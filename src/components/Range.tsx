import type { ReactNode } from 'react';

type RangeProps = {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue: (value: number) => string;
};

export function Range({ label, value, min, max, step, onChange, formatValue }: RangeProps) {
  return <label className="range-control">
    <span>{label}</span>
    <strong>{formatValue(value)}</strong>
    <input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} />
  </label>;
}
