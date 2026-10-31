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

export function DriftVelocity() {
  const [mobility, setMobility] = useState(800);
  const saturationVelocity = 1e7; // cm/s
  const fields = sample(160, 0, 50); // kV/cm
  const velocityAt = (field: number) => {
    const linearVelocity = mobility * field * 1e3; // (cm²/V·s)(V/cm)
    return saturationVelocity * linearVelocity / (saturationVelocity + linearVelocity);
  };
  const drift = fields.map(field => ({ x: field, y: velocityAt(field) / 1e7 }));
  const linear = [0, 10].map(field => ({ x: field, y: mobility * field * 1e3 / 1e7 }));
  return <>
    <Range label={<><i>μ</i> · mobilitat</>} value={mobility} min={200} max={1600} step={50} onChange={setMobility} formatValue={v => `${v} cm²/(V·s)`} />
    <div className="chart-legend" aria-label="Llegenda de velocitat de deriva">
      <span><i className="legend-line" style={{ borderColor: C.electron }} />Model amb saturació</span>
      <span><i className="legend-line legend-dashed" style={{ borderColor: C.muted }} />Règim lineal v = μξ</span>
    </div>
    <Plot xDomain={[0, 50]} yDomain={[0, 1.2]} xLabel="Camp elèctric ξ (kV/cm)" yLabel="Velocitat de deriva ⟨vα⟩ (10⁷ cm/s)" xTicks={[0, 10, 20, 30, 40, 50]} yTicks={[0, 0.25, 0.5, 0.75, 1, 1.2]}>
      {({ x, y, height }) => <>
        <rect x={x(0)} y={0} width={x(10) - x(0)} height={height} fill={C.electron} opacity={0.055} />
        <rect x={x(10)} y={0} width={x(30) - x(10)} height={height} fill={C.conduction} opacity={0.055} />
        <rect x={x(30)} y={0} width={x(50) - x(30)} height={height} fill={C.teal} opacity={0.07} />
        <text x={x(5)} y={y(1.12)} textAnchor="middle" className="plot-annotation" fill={C.electron}>Lineal</text>
        <text x={x(20)} y={y(1.12)} textAnchor="middle" className="plot-annotation" fill={C.conduction}>Intermèdia</text>
        <text x={x(40)} y={y(1.12)} textAnchor="middle" className="plot-annotation" fill={C.teal}>Saturació · fonons</text>
        <LinePath data={linear} x={d => x(d.x)} y={d => y(Math.min(1.2, d.y))} stroke={C.muted} strokeWidth={2} strokeDasharray="6 5" />
        <LinePath data={drift} x={d => x(d.x)} y={d => y(d.y)} stroke={C.electron} strokeWidth={3} />
      </>}
    </Plot>
    <p className="plot-caption">A camp baix, la velocitat creix proporcionalment al camp i a la mobilitat. A camp alt, els xocs limiten la velocitat i la corba s’acosta a la saturació.</p>
    <Equation math="\langle v_\alpha\rangle=\frac{\mu\,\xi}{1+\mu|\xi|/v_{\mathrm{sat}}},\qquad v_{\mathrm{sat}}\approx10^7\ \mathrm{cm/s}" />
  </>;
}
