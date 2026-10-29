import { useState } from 'react';
import { LinePath } from '@visx/shape';
import { Plot } from '../Charts';
import { Equation } from '../components/Equation';
import { Range } from '../components/Range';
import { COLORS as C, E_G, K_B_EV, NC_300, NV_300, format, intrinsicDensity, sample } from '../physics';
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
    <Equation math="n=p=n_i,\qquad n_i^2=M_CM_Ve^{-E_g/(kT)}" />
  </>;
}

export function DopedStatistics() {
  const [logDonors, setLogDonors] = useState(16);
  const [logAcceptors, setLogAcceptors] = useState(15);
  const [temperature, setTemperature] = useState(300);
  const donors = 10 ** logDonors;
  const acceptors = 10 ** logAcceptors;
  const ni = intrinsicDensity(temperature);
  const kT = K_B_EV * temperature;
  const ncT = NC_300 * (temperature / 300) ** 1.5;
  const nvT = NV_300 * (temperature / 300) ** 1.5;
  const donorLevel = E_G - 0.045;
  const acceptorLevel = 0.045;
  const carriersAt = (ef: number) => {
    const n = ncT * Math.exp(Math.max(-100, Math.min(40, (ef - E_G) / kT)));
    const p = nvT * Math.exp(Math.max(-100, Math.min(40, -ef / kT)));
    const ionizedDonors = donors / (1 + 2 * Math.exp(Math.max(-100, Math.min(100, (ef - donorLevel) / kT))));
    const ionizedAcceptors = acceptors / (1 + 2 * Math.exp(Math.max(-100, Math.min(100, (acceptorLevel - ef) / kT))));
    return { n, p, ionizedDonors, ionizedAcceptors };
  };
  let lowEf = -0.2;
  let highEf = 1.32;
  for (let i = 0; i < 80; i++) {
    const mid = (lowEf + highEf) / 2;
    const balance = carriersAt(mid);
    if (balance.n + balance.ionizedAcceptors - balance.p - balance.ionizedDonors > 0) highEf = mid;
    else lowEf = mid;
  }
  const fermiLevel = (lowEf + highEf) / 2;
  const equilibrium = carriersAt(fermiLevel);
  const netIonizedDoping = equilibrium.ionizedDonors - equilibrium.ionizedAcceptors;
  const intrinsicLevel = E_G / 2 + kT / 2 * Math.log(nvT / ncT);
  const intrinsicDominates = equilibrium.n + equilibrium.p > 2 * Math.abs(netIonizedDoping);
  const fermiExplanation = intrinsicDominates
    ? `Els portadors intrínsecs ja pesen tant com el dopatge net; per això E_F s’acosta al nivell intrínsec E_i ≈ ${intrinsicLevel.toFixed(2)} eV.`
    : netIonizedDoping > 0
      ? `Predominen els donadors ionitzats (Nᴅ⁺ − Nₐ⁻ = ${netIonizedDoping.toExponential(2)} cm⁻³). E_F puja: així augmenta n i baixa Nᴅ⁺ fins que es compensa la càrrega.`
      : `Predominen els acceptadors ionitzats (Nₐ⁻ − Nᴅ⁺ = ${(-netIonizedDoping).toExponential(2)} cm⁻³). E_F baixa: així augmenta p i baixa Nₐ⁻ fins que es compensa la càrrega.`;
  const fermiSweep = sample(151, -0.2, 1.32);
  const carrierCurves = fermiSweep.map(ef => ({ x: ef, ...carriersAt(ef) }));
  return <>
    <div className="controls three-controls">
      <Range label="Donadors Nᴅ" value={logDonors} min={12} max={19} step={0.1} onChange={setLogDonors} formatValue={() => `${donors.toExponential(1)} cm⁻³`} />
      <Range label="Acceptadors Nₐ" value={logAcceptors} min={12} max={19} step={0.1} onChange={setLogAcceptors} formatValue={() => `${acceptors.toExponential(1)} cm⁻³`} />
      <Range label="Temperatura" value={temperature} min={200} max={700} step={10} onChange={setTemperature} formatValue={v => `${v} K`} />
    </div>
    <div className="chart-legend" aria-label="Llegenda de concentracions segons el nivell de Fermi">
      <span><i className="legend-line" style={{ borderColor: C.electron }} />Electrons n</span>
      <span><i className="legend-line" style={{ borderColor: C.hole }} />Forats p</span>
      <span><i className="legend-line" style={{ borderColor: C.conduction }} />Donadors ionitzats Nᴅ⁺</span>
      <span><i className="legend-line" style={{ borderColor: C.purple }} />Acceptadors ionitzats Nₐ⁻</span>
      <span><i className="legend-line legend-dashed" style={{ borderColor: C.muted }} />Intrínseca nᵢ</span>
      <span><i className="legend-line legend-dashed" style={{ borderColor: C.muted }} />Nivell intrínsec Eᵢ</span>
    </div>
    <Plot xDomain={[-0.2, 1.32]} yDomain={[0, 20]} xLabel="Nivell de Fermi E_F (eV)" yLabel="log₁₀ concentració (cm⁻³)" xTicks={[0, E_G / 2, E_G]} yTicks={[0, 5, 10, 15, 20]}>
        {({ x, y }) => <>
          {[
            { key: 'n', color: C.electron }, { key: 'p', color: C.hole },
            { key: 'ionizedDonors', color: C.conduction }, { key: 'ionizedAcceptors', color: C.purple },
          ].map(line => <LinePath key={line.key} data={carrierCurves.map(d => ({ x: d.x, y: Math.log10(Math.max(d[line.key as keyof typeof d] as number, 1)) }))} x={d => x(d.x)} y={d => y(d.y)} stroke={line.color} strokeWidth={2.8} />)}
          <line x1={x(-0.2)} x2={x(1.32)} y1={y(Math.log10(Math.max(ni, 1)))} y2={y(Math.log10(Math.max(ni, 1)))} stroke={C.muted} strokeWidth={1.1} strokeDasharray="4 5" opacity={0.55} />
          <text x={x(1.29)} y={y(Math.log10(Math.max(ni, 1))) - 7} textAnchor="end" className="plot-annotation" fill={C.muted}>nᵢ</text>
          <line x1={x(intrinsicLevel)} x2={x(intrinsicLevel)} y1={y(0)} y2={y(20)} stroke={C.muted} strokeWidth={1.1} strokeDasharray="4 5" opacity={0.55} />
          <text x={x(intrinsicLevel) + 5} y={y(2)} className="plot-annotation" fill={C.muted}>Eᵢ</text>
          <line x1={x(fermiLevel)} x2={x(fermiLevel)} y1={y(0)} y2={y(20)} stroke={C.fermi} strokeWidth={2} strokeDasharray="6 3" opacity={0.9} />
          <text x={x(fermiLevel) + 6} y={y(18)} className="plot-annotation" fill={C.fermi}>E_F neutre</text>
        </>}
    </Plot>
    <div className="metric"><span>n</span><strong>{equilibrium.n.toExponential(2)} cm⁻³</strong><span>p</span><strong>{equilibrium.p.toExponential(2)} cm⁻³</strong><span>Nᴅ⁺</span><strong>{equilibrium.ionizedDonors.toExponential(2)} cm⁻³</strong><span>Nₐ⁻</span><strong>{equilibrium.ionizedAcceptors.toExponential(2)} cm⁻³</strong></div>
    <div className="insight"><strong>Balanç a E_F = {fermiLevel.toFixed(3)} eV:</strong> n ({equilibrium.n.toExponential(2)}) + Nₐ⁻ ({equilibrium.ionizedAcceptors.toExponential(2)}) = p ({equilibrium.p.toExponential(2)}) + Nᴅ⁺ ({equilibrium.ionizedDonors.toExponential(2)}) cm⁻³. {fermiExplanation}</div>
    <Equation math="E_F=E_{Fi}+kT\ln\!\left(\frac{n}{n_i}\right)=E_{Fi}-kT\ln\!\left(\frac{p}{n_i}\right),\qquad E_{Fi}=\frac{E_C+E_V}{2}+\frac{kT}{2}\ln\!\frac{M_V}{M_C}" />
    <Equation math="n+N_A^-=p+N_D^+" />
    <Equation math="n=M_Ce^{-(E_C-E_F)/(kT)},\qquad p=M_Ve^{-(E_F-E_V)/(kT)}" />
    <Equation math="\frac{N_D^+}{N_D}=\frac{1}{1+2e^{(E_F-E_D)/(kT)}},\qquad \frac{N_A^-}{N_A}=\frac{1}{1+2e^{(E_A-E_F)/(kT)}}" />
  </>;
}

export function ShockleyRegimes() {
  const [logDonors, setLogDonors] = useState(16);
  const [logNc300, setLogNc300] = useState(Math.log10(NC_300));
  const [logNv300, setLogNv300] = useState(Math.log10(NV_300));
  const [temperature, setTemperature] = useState(300);
  const donors = 10 ** logDonors;
  const nc300 = 10 ** logNc300;
  const nv300 = 10 ** logNv300;
  const solveState = (t: number) => {
    const kT = K_B_EV * t;
    const ncT = nc300 * (t / 300) ** 1.5;
    const nvT = nv300 * (t / 300) ** 1.5;
    const donorLevel = E_G - 0.045;
    const atFermiLevel = (ef: number) => {
      const n = ncT * Math.exp(Math.max(-100, Math.min(40, (ef - E_G) / kT)));
      const p = nvT * Math.exp(Math.max(-100, Math.min(40, -ef / kT)));
      const ionizedDonors = donors / (1 + 2 * Math.exp(Math.max(-100, Math.min(100, (ef - donorLevel) / kT))));
      return { n, p, ionizedDonors };
    };
    let lowEf = -0.2;
    let highEf = 1.32;
    for (let i = 0; i < 80; i++) {
      const mid = (lowEf + highEf) / 2;
      const state = atFermiLevel(mid);
      if (state.n - state.p - state.ionizedDonors > 0) highEf = mid;
      else lowEf = mid;
    }
    const fermiLevel = (lowEf + highEf) / 2;
    const state = atFermiLevel(fermiLevel);
    return { ...state, fermiLevel, intrinsic: Math.sqrt(ncT * nvT) * Math.exp(-E_G / (2 * kT)), ncT, nvT };
  };
  const temperatures = sample(140, 45, 900);
  const transport = temperatures.map(t => ({ t, ...solveState(t) }));
  const carrierSeries: { data: { x: number; y: number }[]; color: string; width: number; dashed?: boolean }[] = [
    { data: transport.map(d => ({ x: 1000 / d.t, y: Math.log10(Math.max(d.n, 1)) })), color: C.electron, width: 2.8 },
    { data: transport.map(d => ({ x: 1000 / d.t, y: Math.log10(Math.max(d.p, 1)) })), color: C.hole, width: 3.4 },
    { data: transport.map(d => ({ x: 1000 / d.t, y: Math.log10(Math.max(d.intrinsic, 1)) })), color: C.teal, width: 2.8, dashed: true },
  ];
  const selectedState = solveState(temperature);
  return <Card tag="DIAGRAMA D’ARRHENIUS · PORTADORS" title="Concentració de portadors en funció de 1000/T">
    <div className="controls three-controls">
      <Range label="Concentració donadora Nᴅ" value={logDonors} min={14} max={18} step={0.1} onChange={setLogDonors} formatValue={() => `${donors.toExponential(1)} cm⁻³`} />
      <Range label="M_C(300 K)" value={logNc300} min={18} max={21} step={0.01} onChange={setLogNc300} formatValue={() => `${nc300.toExponential(2)} cm⁻³`} />
      <Range label="M_V(300 K)" value={logNv300} min={18} max={21} step={0.01} onChange={setLogNv300} formatValue={() => `${nv300.toExponential(2)} cm⁻³`} />
    </div>
    <Range label="Temperatura seleccionada" value={temperature} min={50} max={900} step={10} onChange={setTemperature} formatValue={v => `${v} K`} />
    <div className="chart-legend" aria-label="Llegenda de concentracions">
      <span><i className="legend-line" style={{ borderColor: C.electron }} />Electrons n</span>
      <span><i className="legend-line" style={{ borderColor: C.hole }} />Forats p · s’accentua a T altes</span>
      <span><i className="legend-line legend-dashed" style={{ borderColor: C.teal }} />Intrínsec n = p = nᵢ</span>
      <span><i className="legend-line legend-dashed" style={{ borderColor: C.muted }} />T seleccionada</span>
    </div>
    <Plot xDomain={[1, 24]} yDomain={[0, 20]} xLabel="1000/T (10³ K⁻¹)" yLabel="log₁₀ concentració (cm⁻³)" xTicks={[2, 5, 10, 15, 20]} yTicks={[0, 5, 10, 15, 20]}>
      {({ x, y, height }) => <>
        <rect x={x(1)} y={0} width={x(2.2) - x(1)} height={height} fill={C.hole} opacity={0.06} />
        <rect x={x(4)} y={0} width={x(24) - x(4)} height={height} fill={C.electron} opacity={0.05} />
        <text x={x(1.6)} y={y(19)} textAnchor="middle" className="plot-annotation">T altes · p intrínsec</text>
        <text x={x(12)} y={y(19)} textAnchor="middle" className="plot-annotation">T baixes · n i p</text>
        {carrierSeries.map(line => <LinePath key={line.color} data={line.data} x={d => x(d.x)} y={d => y(d.y)} stroke={line.color} strokeWidth={line.width} strokeDasharray={line.dashed ? '6 4' : undefined} />)}
        <line x1={x(1000 / temperature)} x2={x(1000 / temperature)} y1={y(0)} y2={y(20)} stroke={C.muted} strokeWidth={1.5} strokeDasharray="5 5" opacity={0.8} />
      </>}
    </Plot>
    <div className="metric"><span>Nivell de Fermi E_F</span><strong>{selectedState.fermiLevel.toFixed(3)} eV</strong><span>Fracció ionitzada Nᴅ⁺/Nᴅ</span><strong>{(100 * selectedState.ionizedDonors / donors).toFixed(2)} %</strong><span>Nᴅ⁺</span><strong>{selectedState.ionizedDonors.toExponential(2)} cm⁻³</strong><span>M_C(T) / M_V(T)</span><strong>{selectedState.ncT.toExponential(2)} / {selectedState.nvT.toExponential(2)} cm⁻³</strong></div>
    <p className="insight">A temperatures baixes es veuen n i p en el règim de congelació dels dopants; a temperatures altes destaca p en el règim intrínsec. La posició a l’eix X augmenta cap a temperatures més baixes.</p>
    <Equation math="M_{C,V}(T)=M_{C,V}(300)\left(\frac{T}{300}\right)^{3/2},\qquad n=p+N_D^+" />
    <Equation math="n=M_C(T)e^{-(E_C-E_F)/(kT)},\quad p=M_V(T)e^{-(E_F-E_V)/(kT)},\quad \frac{N_D^+}{N_D}=\frac{1}{1+2e^{(E_F-E_D)/(kT)}}" />
  </Card>;
}
