import { useState } from 'react';
import { LinePath } from '@visx/shape';
import { Lines, Plot } from '../Charts';
import { Equation } from '../components/Equation';
import { Range } from '../components/Range';
import { COLORS as C, E_G, K_B_EV, NC_300, NV_300, carrierDensities, format, intrinsicDensity, sample } from '../physics';
import { Card } from '../components/Card';

export function BandAndDos() {
  const energies = sample(80, 0, 1);
  const [selectedEnergy, setSelectedEnergy] = useState(1.2);
  const conductionDos = selectedEnergy >= E_G ? Math.sqrt((selectedEnergy - E_G) / 0.65) : 0;
  const valenceDos = selectedEnergy <= 0 ? 1.12 * Math.sqrt(-selectedEnergy / 0.65) : 0;
  return <>
    <div className="plot-pair"><Plot xDomain={[0, 1]} yDomain={[-0.45, 1.67]} xLabel="Esquema de bandes" yLabel="Energia (eV)" xTicks={[]} yTicks={[0, E_G]} grid={false}>
      {({ x, y }) => <>
        <rect x={x(0.14)} y={y(0)} width={x(0.86) - x(0.14)} height={y(-0.45) - y(0)} fill={C.valence} opacity={0.68} />
        <rect x={x(0.14)} y={y(E_G + 0.55)} width={x(0.86) - x(0.14)} height={y(E_G) - y(E_G + 0.55)} fill={C.conduction} opacity={0.68} />
        <rect x={x(0.14)} y={y(E_G)} width={x(0.86) - x(0.14)} height={y(0) - y(E_G)} fill={C.gap} />
        <text x={x(0.5)} y={y(1.4)} textAnchor="middle" className="plot-annotation">Conducció · electrons</text>
        <text x={x(0.5)} y={y(-0.2)} textAnchor="middle" className="plot-annotation">València · forats</text>
        <text x={x(0.5)} y={y(0.56)} textAnchor="middle" className="plot-annotation">Gap prohibit · 1,12 eV</text>
      </>}
    </Plot>
    <div>
      <Range label="Energia seleccionada E" value={selectedEnergy} min={-0.65} max={1.77} step={0.01} onChange={setSelectedEnergy} formatValue={v => `${format(v, 2)} eV`} />
      <Plot xDomain={[0, 1.25]} yDomain={[-0.72, 1.82]} xLabel="Densitat d’estats N(E) · relativa" yLabel="Energia E (eV)" xTicks={[0, 0.5, 1]} yTicks={[0, E_G]}>
        {({ x, y }) => <>
          <rect x={x(0)} y={y(E_G)} width={x(1.25) - x(0)} height={y(0) - y(E_G)} fill={C.gap} />
          <LinePath data={energies.map(z => ({ x: Math.sqrt(z), y: E_G + 0.65 * z }))} x={d => x(d.x)} y={d => y(d.y)} stroke={C.conduction} strokeWidth={3} />
          <LinePath data={energies.map(z => ({ x: 1.12 * Math.sqrt(z), y: -0.65 * z }))} x={d => x(d.x)} y={d => y(d.y)} stroke={C.valence} strokeWidth={3} />
          <line x1={x(0)} x2={x(1.25)} y1={y(selectedEnergy)} y2={y(selectedEnergy)} stroke={C.ink} strokeDasharray="4 4" opacity={0.7} />
          {conductionDos > 0 && <circle cx={x(conductionDos)} cy={y(selectedEnergy)} r={5} fill={C.conduction} stroke="white" strokeWidth={2} />}
          {valenceDos > 0 && <circle cx={x(valenceDos)} cy={y(selectedEnergy)} r={5} fill={C.valence} stroke="white" strokeWidth={2} />}
          <text x={x(0.72)} y={y(1.58)} fill={C.conduction} className="plot-annotation">N<tspan baselineShift="sub">c</tspan>(E)</text>
          <text x={x(0.72)} y={y(-0.54)} fill={C.valence} className="plot-annotation">N<tspan baselineShift="sub">v</tspan>(E)</text>
        </>}
      </Plot>
    </div></div>
    <div className="metric"><span>N<sub>v</sub>(E) · valència</span><strong>{format(valenceDos, 2)}</strong><span>N<sub>c</sub>(E) · conducció</span><strong>{format(conductionDos, 2)}</strong><span>Valors relatius; dins del gap, tots dos són 0.</span></div>
    <Equation math="N_c(E)=\sqrt{\frac{E-E_g}{0.65}}\;(E\ge E_g),\qquad N_v(E)=1.12\sqrt{\frac{-E}{0.65}}\;(E\le 0)" />
  </>;
}

export function IntrinsicCarriers() {
  const [temperature, setTemperature] = useState(300);
  const count = Math.round(3 + 13 * (intrinsicDensity(temperature) / intrinsicDensity(700)) ** 0.35);
  const dots = Array.from({ length: count }, (_, i) => ({ x: 0.1 + (i * 0.61803398875 % 0.8), e: E_G + 0.08 + (i * 0.317 % 0.36), h: -0.06 - (i * 0.229 % 0.36) }));
  return <>
    <Range label="Temperatura" value={temperature} min={50} max={700} step={10} onChange={setTemperature} formatValue={v => `${v} K`} />
    <Plot xDomain={[0, 1]} yDomain={[-0.55, 1.72]} xLabel="Posició esquemàtica" yLabel="Energia E (eV)" xTicks={[]} yTicks={[0, E_G]} grid={false}>
      {({ x, y, width }) => <>
        <rect x={x(0)} y={y(E_G)} width={width} height={y(0) - y(E_G)} fill={C.gap} />
        <rect x={x(0)} y={y(1.72)} width={width} height={y(E_G) - y(1.72)} fill={C.conduction} opacity={0.2} />
        <rect x={x(0)} y={y(0)} width={width} height={y(-0.55) - y(0)} fill={C.valence} opacity={0.2} />
        <line x1={x(0)} x2={x(1)} y1={y(E_G)} y2={y(E_G)} stroke={C.ink} />
        <line x1={x(0)} x2={x(1)} y1={y(0)} y2={y(0)} stroke={C.ink} />
        {dots.map((dot, i) => <g key={i}><circle cx={x(dot.x)} cy={y(dot.e)} r={4} fill={C.electron} /><circle cx={x(1 - dot.x)} cy={y(dot.h)} r={4} fill="white" stroke={C.hole} strokeWidth={2} /></g>)}
        <text x={x(0.03)} y={y(1.5)} className="plot-annotation">Electrons</text><text x={x(0.03)} y={y(-0.34)} className="plot-annotation">Forats</text>
      </>}
    </Plot>
    <div className="metric"><span>Concentració intrínseca</span><strong>{intrinsicDensity(temperature).toExponential(2)} cm⁻³</strong><span>En material intrínsec: n = p = nᵢ</span></div>
    <Equation math="n=p=n_i,\qquad n_i^2=N_CN_Ve^{-E_g/(k_BT)}" />
  </>;
}

export function DopedStatistics() {
  const [dopant, setDopant] = useState<'donor' | 'acceptor'>('donor');
  const [logDoping, setLogDoping] = useState(16);
  const [temperature, setTemperature] = useState(300);
  const doping = 10 ** logDoping;
  const ni = intrinsicDensity(temperature);
  const majority = 0.5 * (doping + Math.sqrt(doping ** 2 + 4 * ni ** 2));
  const electrons = dopant === 'donor' ? majority : ni ** 2 / majority;
  const holes = dopant === 'donor' ? ni ** 2 / majority : majority;
  const intrinsicLevel = E_G / 2 + K_B_EV * temperature / 2 * Math.log(NV_300 / NC_300);
  const fermiLevel = intrinsicLevel + K_B_EV * temperature * Math.log(electrons / ni);
  const occupation = sample(151, -0.25, 1.4).map(energy => ({ x: 1 / (1 + Math.exp(Math.max(-40, Math.min(40, (energy - fermiLevel) / (K_B_EV * temperature))))), y: energy }));
  return <>
    <div className="dopant-switch" role="group" aria-label="Tipus de dopatge">
      <button type="button" aria-pressed={dopant === 'donor'} onClick={() => setDopant('donor')}>Donador · tipus n</button>
      <button type="button" aria-pressed={dopant === 'acceptor'} onClick={() => setDopant('acceptor')}>Acceptador · tipus p</button>
    </div>
    <div className="controls two-controls">
      <Range label="Concentració de dopants" value={logDoping} min={14} max={19} step={0.1} onChange={setLogDoping} formatValue={() => `${doping.toExponential(1)} cm⁻³`} />
      <Range label="Temperatura" value={temperature} min={200} max={700} step={10} onChange={setTemperature} formatValue={v => `${v} K`} />
    </div>
    <div className="plot-pair">
      <Plot xDomain={[0, 1]} yDomain={[-0.25, 1.4]} xLabel="Posició esquemàtica" yLabel="Energia (eV)" xTicks={[]} yTicks={[0, E_G]} grid={false}>
        {({ x, y, width }) => <>
          <rect x={x(0)} y={y(E_G)} width={width} height={y(0) - y(E_G)} fill={C.gap} />
          <line x1={x(0.12)} x2={x(0.88)} y1={y(E_G)} y2={y(E_G)} stroke={C.conduction} strokeWidth={3} />
          <line x1={x(0.12)} x2={x(0.88)} y1={y(0)} y2={y(0)} stroke={C.valence} strokeWidth={3} />
          <line x1={x(0.12)} x2={x(0.88)} y1={y(fermiLevel)} y2={y(fermiLevel)} stroke={C.ink} strokeWidth={2.5} strokeDasharray="6 4" />
          <text x={x(0.9)} y={y(E_G) + 4} className="plot-annotation" fill={C.conduction}>E<tspan baselineShift="sub">C</tspan></text>
          <text x={x(0.9)} y={y(0) + 4} className="plot-annotation" fill={C.valence}>E<tspan baselineShift="sub">V</tspan></text>
          <text x={x(0.12)} y={y(fermiLevel) - 8} className="plot-annotation">E<tspan baselineShift="sub">F</tspan></text>
        </>}
      </Plot>
      <Plot xDomain={[0, 1]} yDomain={[-0.25, 1.4]} xLabel="Ocupació f(E)" yLabel="Energia (eV)" xTicks={[0, 0.5, 1]} yTicks={[0, E_G]}>
        {({ x, y }) => <>
          <LinePath data={occupation} x={d => x(d.x)} y={d => y(d.y)} stroke={C.ink} strokeWidth={3} />
          <line x1={x(0)} x2={x(1)} y1={y(fermiLevel)} y2={y(fermiLevel)} stroke={C.muted} strokeDasharray="4 4" />
          <text x={x(0.65)} y={y(fermiLevel) - 8} className="plot-annotation">E<tspan baselineShift="sub">F</tspan></text>
        </>}
      </Plot>
    </div>
    <div className="metric"><span>Electrons n</span><strong>{electrons.toExponential(2)} cm⁻³</strong><span>Forats p</span><strong>{holes.toExponential(2)} cm⁻³</strong><span>nᵢ</span><strong>{ni.toExponential(2)} cm⁻³</strong><span>Ionització completa · aproximació no degenerada</span></div>
    <Equation math="n+N_A^-=p+N_D^+,\qquad np=n_i^2" />
    <Equation math="f(E)=\frac{1}{1+e^{(E-E_F)/(k_BT)}}" />
  </>;
}

export function ShockleyRegimes() {
  const [logDonors, setLogDonors] = useState(16);
  const donors = 10 ** logDonors;
  const temperatures = sample(140, 45, 900);
  const transport = temperatures.map(t => ({ t, ...carrierDensities(t, donors) }));
  const invT = transport.map(d => ({ x: 1000 / d.t, y: Math.log(d.electrons * 1.602e-19 * 1350 * (d.t / 300) ** -1.5) }));
  const carrierSeries = [
    { data: transport.map(d => ({ x: d.t, y: Math.log10(Math.max(d.electrons, 1)) })), color: C.electron },
    { data: transport.map(d => ({ x: d.t, y: Math.log10(Math.max(d.holes, 1)) })), color: C.hole },
    { data: transport.map(d => ({ x: d.t, y: Math.log10(Math.max(d.intrinsic, 1)) })), color: C.teal, dashed: true },
  ];
  return <Card tag="TIPUS N · MODEL ESQUEMÀTIC" title="Règims tèrmics i diagrama de Shockley">
    <Range label="Concentració donadora Nᴅ" value={logDonors} min={14} max={18} step={0.1} onChange={setLogDonors} formatValue={() => `${donors.toExponential(1)} cm⁻³`} />
    <Plot xDomain={[1, 24]} yDomain={[Math.min(...invT.map(d => d.y)) - 1, Math.max(...invT.map(d => d.y)) + 1]} xLabel="1000/T (K⁻¹)" yLabel="ln σ (S/cm)" xTicks={[2, 5, 10, 20]}>
      {({ x, y }) => <LinePath data={invT} x={d => x(d.x)} y={d => y(d.y)} stroke={C.ink} strokeWidth={2.5} />}
    </Plot>
    <Plot xDomain={[40, 900]} yDomain={[0, 20]} xLabel="Temperatura (K)" yLabel="Concentració (cm⁻³, escala log)" xTicks={[100, 300, 500, 700, 900]} yTicks={[0, 5, 10, 15, 20]} yFormat={v => `10${format(v, 0)}`}>
      {({ x, y }) => <Lines series={carrierSeries} x={x} y={y} />}
    </Plot>
    <p className="insight">A baixa temperatura els dopants es congelen; a temperatura intermèdia dominen els donadors; a alta temperatura domina la generació intrínseca.</p>
    <Equation math="\sigma=q(n\mu_n+p\mu_p)" />
  </Card>;
}
