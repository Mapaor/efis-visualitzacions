import { useState } from 'react';
import { LinePath } from '@visx/shape';
import { Plot } from '../Charts';
import { Equation } from '../components/Equation';
import { Range } from '../components/Range';
import { COLORS as C, E_G, K_B_EV, format, sample } from '../physics';

export function TransportEquilibrium() {
  const [field, setField] = useState(0.4);
  const [gradient, setGradient] = useState(12);
  const [temperature, setTemperature] = useState(300);
  const thermalVoltage = K_B_EV * temperature;
  const points = sample(121, -1, 1);
  const density = points.map(position => ({ x: position, y: 0.55 + gradient * position / 100 }));
  const conductionBand = points.map(position => ({ x: position, y: E_G + field * position }));
  const valenceBand = points.map(position => ({ x: position, y: field * position }));
  const diffusionPart = thermalVoltage * (gradient / 100) / 0.55;
  const electronCurrent = field + diffusionPart;
  const holeCurrent = field - diffusionPart;
  const direction = (value: number) => value > 0.03 ? '→' : value < -0.03 ? '←' : '0';
  return <>
    <div className="controls three-controls">
      <Range label="Camp elèctric ξ (relatiu)" value={field} min={-1} max={1} step={0.05} onChange={setField} formatValue={v => `${format(v, 2)}`} />
      <Range label="Gradient de concentració (relatiu)" value={gradient} min={-20} max={20} step={1} onChange={setGradient} formatValue={v => `${format(v, 0)}`} />
      <Range label="Temperatura" value={temperature} min={250} max={500} step={10} onChange={setTemperature} formatValue={v => `${v} K`} />
    </div>
    <div className="plot-pair">
      <Plot xDomain={[-1, 1]} yDomain={[-1.2, 2.3]} xLabel="Posició x (relativa)" yLabel="Energia de banda (eV)" xTicks={[-1, 0, 1]} yTicks={[-1, 0, E_G, 2]}>
        {({ x, y }) => <>
          <LinePath data={conductionBand} x={d => x(d.x)} y={d => y(d.y)} stroke={C.conduction} strokeWidth={3} />
          <LinePath data={valenceBand} x={d => x(d.x)} y={d => y(d.y)} stroke={C.valence} strokeWidth={3} />
          <text x={x(0.82)} y={y(E_G + field * 0.82) - 8} className="plot-annotation" fill={C.conduction}>E<tspan baselineShift="sub">C</tspan></text>
          <text x={x(0.82)} y={y(field * 0.82) + 15} className="plot-annotation" fill={C.valence}>E<tspan baselineShift="sub">V</tspan></text>
        </>}
      </Plot>
      <Plot xDomain={[-1, 1]} yDomain={[0, 1]} xLabel="Posició x (relativa)" yLabel="Concentració normalitzada" xTicks={[-1, 0, 1]} yTicks={[0, 0.5, 1]}>
        {({ x, y }) => <LinePath data={density} x={d => x(d.x)} y={d => y(d.y)} stroke={C.electron} strokeWidth={3} />}
      </Plot>
    </div>
    <div className="metric"><span>Corrent electrònic J<sub>n</sub></span><strong>{direction(electronCurrent)} {format(Math.abs(electronCurrent), 2)} · relatiu</strong><span>Corrent de forats J<sub>p</sub></span><strong>{direction(holeCurrent)} {format(Math.abs(holeCurrent), 2)} · relatiu</strong></div>
    <p className="plot-caption">El camp inclina les bandes; el gradient produeix difusió. Canvia el signe dels controls per veure com s’inverteixen les contribucions al corrent.</p>
    <Equation math="\xi=\frac{1}{q}\frac{dE_C}{dx},\qquad J_n=q n\mu_n\xi+qD_n\frac{dn}{dx},\qquad J_p=q p\mu_p\xi-qD_p\frac{dp}{dx}" />
    <Equation math="\frac{D_n}{\mu_n}=\frac{D_p}{\mu_p}=\frac{k_BT}{q}" />
  </>;
}
