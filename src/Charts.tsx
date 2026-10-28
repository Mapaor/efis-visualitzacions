import { useId, type ReactNode } from 'react';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { COLORS, format } from './physics';

const WIDTH = 640;
const HEIGHT = 320;
const MARGIN = { top: 18, right: 20, bottom: 48, left: 66 };

type Datum = { x: number; y: number };
type Series = { data: Datum[]; color: string; dashed?: boolean; width?: number };
type LinearScale = (value: number) => number;
type PlotProps = {
  xDomain: [number, number]; yDomain: [number, number]; xLabel: string; yLabel: string;
  children: (scales: { x: LinearScale; y: LinearScale; width: number; height: number }) => ReactNode;
  xTicks?: number[]; yTicks?: number[]; xFormat?: (value: number) => string; yFormat?: (value: number) => string;
  grid?: boolean;
};

export function Plot({ xDomain, yDomain, xLabel, yLabel, children, xTicks, yTicks, xFormat, yFormat, grid = true }: PlotProps) {
  const clipId = `plot-${useId().replaceAll(':', '')}`;
  const width = WIDTH - MARGIN.left - MARGIN.right;
  const height = HEIGHT - MARGIN.top - MARGIN.bottom;
  const x = scaleLinear({ domain: xDomain, range: [0, width] });
  const y = scaleLinear({ domain: yDomain, range: [height, 0] });
  return <svg className="plot-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${yLabel} segons ${xLabel}`}>
    <Group left={MARGIN.left} top={MARGIN.top}>
      <defs><clipPath id={clipId}><rect width={width} height={height} /></clipPath></defs>
      {grid && <GridRows scale={y} width={width} numTicks={5} stroke={COLORS.grid} />}
      <g clipPath={`url(#${clipId})`}>{children({ x, y, width, height })}</g>
      <AxisBottom top={height} scale={x} tickValues={xTicks} tickFormat={v => xFormat?.(Number(v)) ?? format(Number(v), 1)} stroke="#b7c2cf" tickStroke="#b7c2cf" tickLabelProps={() => ({ fill: COLORS.muted, fontSize: 10, textAnchor: 'middle' })} />
      <AxisLeft scale={y} tickValues={yTicks} tickFormat={v => yFormat?.(Number(v)) ?? format(Number(v), 1)} stroke="#b7c2cf" tickStroke="#b7c2cf" tickLabelProps={() => ({ fill: COLORS.muted, fontSize: 10, textAnchor: 'end', dx: '-0.35em', dy: '0.25em' })} />
      <text x={width / 2} y={height + 42} textAnchor="middle" className="axis-label">{xLabel}</text>
      <text transform={`translate(${-50},${height / 2}) rotate(-90)`} textAnchor="middle" className="axis-label">{yLabel}</text>
    </Group>
  </svg>;
}

export function Lines({ series, x, y }: { series: Series[]; x: LinearScale; y: LinearScale }) {
  return <>{series.map((line, index) => <LinePath key={index} data={line.data} x={d => x(d.x)} y={d => y(d.y)} stroke={line.color} strokeWidth={line.width ?? 2.5} strokeDasharray={line.dashed ? '5 4' : undefined} strokeLinecap="round" strokeLinejoin="round" />)}</>;
}

export type { Datum, Series };
