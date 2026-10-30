import { useState } from 'react';
import { LinePath } from '@visx/shape';
import { Plot } from '../Charts';
import { Equation } from '../components/Equation';
import { Range } from '../components/Range';
import { COLORS as C, E_G, K_B_EV, NC_300, NV_300, format, intrinsicDensity, sample } from '../physics';
import { Card } from '../components/Card';

type DosPoint = { x: number; y: number };

function areaPath(points: DosPoint[], edgeEnergy: number, xScale: (value: number) => number, yScale: (value: number) => number) {
  const last = points[points.length - 1];
  return `M ${xScale(0)} ${yScale(edgeEnergy)} ${points.map(point => `L ${xScale(point.x)} ${yScale(point.y)}`).join(' ')} L ${xScale(0)} ${yScale(last.y)} Z`;
}

function areaBetweenPath(inner: DosPoint[], outer: DosPoint[], xScale: (value: number) => number, yScale: (value: number) => number) {
  const reverseInner = [...inner].reverse();
  return `M ${xScale(outer[0].x)} ${yScale(outer[0].y)} ${outer.slice(1).map(point => `L ${xScale(point.x)} ${yScale(point.y)}`).join(' ')} ${reverseInner.map(point => `L ${xScale(point.x)} ${yScale(point.y)}`).join(' ')} Z`;
}

function fermiOccupation(energy: number, temperature: number, fermiLevel: number) {
  if (temperature <= 0) return energy < fermiLevel ? 1 : energy > fermiLevel ? 0 : 0.5;
  const exponent = Math.max(-60, Math.min(60, (energy - fermiLevel) / (K_B_EV * temperature)));
  return 1 / (1 + Math.exp(exponent));
}

function integrateArea(points: DosPoint[]) {
  return points.slice(1).reduce((sum, point, index) => {
    const previous = points[index];
    return sum + (point.x + previous.x) / 2 * Math.abs(point.y - previous.y);
  }, 0);
}

export function BandAndDos() {
  const energies = sample(80, 0, 1);
  const [electronMass, setElectronMass] = useState(1.08);
  const [holeMass, setHoleMass] = useState(0.56);
  const electronScale = electronMass ** 1.5;
  const holeScale = holeMass ** 1.5;
  const conduction = energies.map(z => ({ x: electronScale * Math.sqrt(z), y: E_G + 0.65 * z }));
  const valence = energies.map(z => ({ x: 1.12 * holeScale * Math.sqrt(z), y: -0.65 * z }));
  const electronArea = (2 / 3) * 0.65 * electronScale;
  const holeArea = (2 / 3) * 0.65 * 1.12 * holeScale;
  return <>
    <div className="controls two-controls">
      <Range label={<><i>m</i><sup>*</sup><sub>nd</sub> · massa efectiva dels electrons</>} value={electronMass} min={0.1} max={2} step={0.01} onChange={setElectronMass} formatValue={v => `${format(v, 2)} m₀`} />
      <Range label={<><i>m</i><sup>*</sup><sub>pd</sub> · massa efectiva dels forats</>} value={holeMass} min={0.1} max={2} step={0.01} onChange={setHoleMass} formatValue={v => `${format(v, 2)} m₀`} />
    </div>
    <Plot xDomain={[0, 4.2]} yDomain={[-0.72, 1.82]} xLabel="Densitat d’estats N(E) · relativa" yLabel="Energia E (eV)" xTicks={[0, 1, 2, 3, 4]} yTicks={[0, E_G]}>
      {({ x, y }) => <>
        <rect x={x(0)} y={y(E_G)} width={x(4.2) - x(0)} height={y(0) - y(E_G)} fill={C.gap} />
        <path d={areaPath(conduction, E_G, x, y)} fill={C.conduction} opacity={0.24} />
        <path d={areaPath(valence, 0, x, y)} fill={C.valence} opacity={0.24} />
        <LinePath data={conduction} x={d => x(d.x)} y={d => y(d.y)} stroke={C.conduction} strokeWidth={3} />
        <LinePath data={valence} x={d => x(d.x)} y={d => y(d.y)} stroke={C.valence} strokeWidth={3} />
        <text x={x(2.6)} y={y(1.58)} fill={C.conduction} className="plot-annotation">N<tspan baselineShift="sub">c</tspan>(E)</text>
        <text x={x(2.6)} y={y(-0.54)} fill={C.valence} className="plot-annotation">N<tspan baselineShift="sub">v</tspan>(E)</text>
      </>}
    </Plot>
    <div className="metric"><span>Àrea ombrejada · conducció</span><strong>{format(electronArea, 2)} unitats relatives · eV</strong><span>Àrea ombrejada · valència</span><strong>{format(holeArea, 2)} unitats relatives · eV</strong></div>
    <Equation math="N_c(E)\propto (m^*_{nd})^{3/2}\sqrt{E-E_g},\qquad N_v(E)\propto (m^*_{pd})^{3/2}\sqrt{-E}" />
  </>;
}

export function FermiDistribution() {
  const [temperature, setTemperature] = useState(300);
  const [fermiLevel, setFermiLevel] = useState(E_G / 2);
  const energies = sample(240, -0.4, 1.52);
  const distribution = energies.map(energy => ({ x: energy, y: fermiOccupation(energy, temperature, fermiLevel) }));
  return <Card tag="DISTRIBUCIÓ DE FERMI-DIRAC" title="Probabilitat d’ocupació f(E)">
    <div className="controls two-controls">
      <Range label="Temperatura" value={temperature} min={50} max={2000} step={10} onChange={setTemperature} formatValue={v => `${v} K`} />
      <Range label={<><i>E</i><sub>F</sub></>} value={fermiLevel} min={0} max={E_G} step={0.01} onChange={setFermiLevel} formatValue={v => `${format(v, 2)} eV`} />
    </div>
    <Plot xDomain={[-0.4, 1.52]} yDomain={[-0.05, 1.05]} xLabel="Energia E (eV)" yLabel="Ocupació f(E)" xTicks={[0, E_G / 2, E_G]} yTicks={[0, 0.5, 1]}>
      {({ x, y, height }) => <>
        <LinePath data={distribution} x={d => x(d.x)} y={d => y(d.y)} stroke={C.fermi} strokeWidth={3} />
        <line x1={x(fermiLevel)} x2={x(fermiLevel)} y1={0} y2={height} stroke={C.muted} strokeWidth={1.7} strokeDasharray="6 5" />
        <text x={x(fermiLevel) + 7} y={y(0.08)} fill={C.muted} className="plot-annotation">E<tspan baselineShift="sub">F</tspan></text>
      </>}
    </Plot>
    <Equation math="f(E)=\frac{1}{1+e^{(E-E_F)/(k_BT)}}" />
  </Card>;
}

export function ThermalDos() {
  const [temperature, setTemperature] = useState(0);
  const fermiLevel = E_G / 2;
  const visualCarrierGain = 16;
  const carrierFraction = (probability: number) => Math.min(0.65, visualCarrierGain * probability);
  const bandSamples = sample(500, 0, 1);
  const conductionStates = bandSamples.map(z => ({ x: Math.sqrt(z), y: E_G + 0.65 * z }));
  const valenceStates = bandSamples.map(z => ({ x: Math.sqrt(z), y: -0.65 * z }));
  const conductionElectrons = conductionStates.map(point => ({
    x: point.x * carrierFraction(fermiOccupation(point.y, temperature, fermiLevel)),
    y: point.y,
  }));
  const valenceElectrons = valenceStates.map(point => ({
    x: point.x * (1 - carrierFraction(1 - fermiOccupation(point.y, temperature, fermiLevel))),
    y: point.y,
  }));
  const valenceHoles = valenceStates.map(point => ({
    x: point.x * carrierFraction(1 - fermiOccupation(point.y, temperature, fermiLevel)),
    y: point.y,
  }));
  const distribution = sample(300, -0.72, 1.82).map(energy => ({
    x: fermiOccupation(energy, temperature, fermiLevel),
    y: energy,
  }));

  return <Card tag="PORTADORS TÈRMICS · DENSITAT D’ESTATS" title="Ocupació dels estats i generació de parelles">
    <Range label="Temperatura" value={temperature} min={0} max={2000} step={10} onChange={setTemperature} formatValue={v => `${v} K`} />
    <div className="chart-legend" aria-label="Llegenda de densitats d’estats i portadors">
      <span><i className="legend-area" style={{ background: C.conduction }} />Estats disponibles · BC</span>
      <span><i className="legend-area" style={{ background: C.valence }} />Estats disponibles · BV</span>
      <span><i className="legend-area" style={{ background: C.electron }} />Electrons ocupants · BV i BC</span>
      <span><i className="legend-area" style={{ background: C.hole }} />Forats p</span>
    </div>
    <p className="plot-caption">A 0 K, la BV és plena d’electrons i la BC és buida. En escalfar, els forats apareixen a la BV i els electrons a la BC; les àrees fosques de portadors s’amplifiquen visualment ×16 per fer més visible la generació. La distribució f(E) es manté sense amplificar.</p>
    <div className="plot-pair">
      <Plot xDomain={[0, 1.5]} yDomain={[-0.72, 1.82]} xLabel="Densitat d’estats N(E) · relativa" yLabel="Energia E (eV)" xTicks={[0, 0.5, 1, 1.5]} yTicks={[0, E_G]}>
        {({ x, y }) => <>
          <rect x={x(0)} y={y(E_G)} width={x(1.5) - x(0)} height={y(0) - y(E_G)} fill={C.gap} />
          <path d={areaPath(conductionStates, E_G, x, y)} fill={C.conduction} opacity={0.18} />
          <path d={areaPath(valenceStates, 0, x, y)} fill={C.valence} opacity={0.18} />
          <path d={areaPath(conductionElectrons, E_G, x, y)} fill={C.electron} opacity={0.86} />
          <path d={areaPath(valenceElectrons, 0, x, y)} fill={C.electron} opacity={0.86} />
          <path d={areaBetweenPath(valenceElectrons, valenceStates, x, y)} fill={C.hole} opacity={0.9} />
          <LinePath data={conductionStates} x={d => x(d.x)} y={d => y(d.y)} stroke={C.conduction} strokeWidth={2.5} />
          <LinePath data={valenceStates} x={d => x(d.x)} y={d => y(d.y)} stroke="#243c55" strokeWidth={2.5} />
        </>}
      </Plot>
      <Plot xDomain={[0, 1]} yDomain={[-0.72, 1.82]} xLabel="Ocupació f(E)" yLabel="Energia E (eV)" xTicks={[0, 0.5, 1]} yTicks={[0, E_G]}>
        {({ x, y }) => <>
          <LinePath data={distribution} x={d => x(d.x)} y={d => y(d.y)} stroke={C.fermi} strokeWidth={3} />
          <line x1={x(0)} x2={x(1)} y1={y(fermiLevel)} y2={y(fermiLevel)} stroke={C.muted} strokeWidth={1.7} strokeDasharray="6 5" />
          <text x={x(0.96)} y={y(fermiLevel) - 7} textAnchor="end" fill={C.muted} className="plot-annotation">E<tspan baselineShift="sub">F</tspan></text>
        </>}
      </Plot>
    </div>
    <div className="metric"><span>Electrons n · àrea BC</span><strong>{integrateArea(conductionElectrons).toExponential(2)} unitats relatives · eV</strong><span>Forats p · àrea despintada BV</span><strong>{integrateArea(valenceHoles).toExponential(2)} unitats relatives · eV</strong></div>
    <Equation math="n_{\mathrm{vis}}\propto\int_{E_C}^{\infty}N_c(E)\min(0.65,16f(E))\,dE,\qquad p_{\mathrm{vis}}\propto\int_{-\infty}^{E_V}N_v(E)\min(0.65,16[1-f(E)])\,dE" />
  </Card>;
}

export function ExtrinsicDos() {
  const [dopingPosition, setDopingPosition] = useState(0);
  const temperature = 900;
  const kT = K_B_EV * temperature;
  const referenceDos300 = Math.sqrt(NC_300 * NV_300);
  const intrinsic = referenceDos300 * (temperature / 300) ** 1.5 * Math.exp(-E_G / (2 * kT));
  const netDoping = dopingPosition / 100 * 1e19;
  const dopantConcentration = Math.abs(netDoping);
  const majority = (Math.abs(netDoping) + Math.sqrt(netDoping ** 2 + 4 * intrinsic ** 2)) / 2;
  const electrons = netDoping >= 0 ? majority : intrinsic ** 2 / majority;
  const holes = netDoping <= 0 ? majority : intrinsic ** 2 / majority;
  const fermiLevel = E_G / 2 + kT * Math.log(electrons / intrinsic);
  const bandSamples = sample(500, 0, 1);
  const conductionStates = bandSamples.map(z => ({ x: Math.sqrt(z), y: E_G + 0.65 * z }));
  const valenceStates = bandSamples.map(z => ({ x: Math.sqrt(z), y: -0.65 * z }));
  const visualCarrierGain = 16;
  const carrierFraction = (probability: number) => Math.min(0.65, visualCarrierGain * probability);
  const conductionElectrons = conductionStates.map(point => ({
    x: point.x * carrierFraction(fermiOccupation(point.y, temperature, fermiLevel)),
    y: point.y,
  }));
  const valenceElectrons = valenceStates.map(point => ({
    x: point.x * (1 - carrierFraction(1 - fermiOccupation(point.y, temperature, fermiLevel))),
    y: point.y,
  }));
  const valenceHoles = valenceStates.map(point => ({
    x: point.x * carrierFraction(1 - fermiOccupation(point.y, temperature, fermiLevel)),
    y: point.y,
  }));
  const distribution = sample(300, -0.72, 1.82).map(energy => {
    const occupation = fermiOccupation(energy, temperature, fermiLevel);
    return { energy, occupation, vacancy: 1 - occupation };
  });
  const semiconductorType = dopingPosition === 0
    ? 'n = p'
    : dopingPosition < 0 ? 'Predomini d’electrons · tipus n' : 'Predomini de forats · tipus p';
  const dopingLabel = dopingPosition === 0
    ? 'Dopatge net nul'
    : `${dopingPosition < 0 ? 'Nᴅ' : 'Nₐ'} = ${dopantConcentration.toExponential(1)} cm⁻³`;

  return <Card tag="SEMICONDUCTOR EXTRÍNSEC · T = 900 K" title="Dopatge, portadors i nivell de Fermi">
    <Range label="Dopatge · tipus n ← intrínsec → tipus p" value={dopingPosition} min={-100} max={100} step={1} onChange={setDopingPosition} formatValue={() => dopingLabel} />
    <div className="insight"><strong>{semiconductorType}</strong> · n = {electrons.toExponential(2)} cm⁻³, p = {holes.toExponential(2)} cm⁻³. E<sub>F</sub> = {fermiLevel.toFixed(3)} eV.</div>
    <div className="chart-legend" aria-label="Llegenda de densitats d’estats i portadors">
      <span><i className="legend-area" style={{ background: C.conduction }} />Estats totals · BC</span>
      <span><i className="legend-area" style={{ background: C.valence }} />Estats totals · BV</span>
      <span><i className="legend-area" style={{ background: C.electron }} />Electrons n</span>
      <span><i className="legend-area" style={{ background: C.hole }} />Forats p</span>
      <span><i className="legend-line" style={{ borderColor: C.fermi }} />f(E)</span>
      <span><i className="legend-line" style={{ borderColor: C.hole }} />1 − f(E)</span>
    </div>
    <div className="plot-pair">
      <Plot xDomain={[0, 1.5]} yDomain={[-0.72, 1.82]} xLabel="Densitat d’estats N(E) · relativa" yLabel="Energia E (eV)" xTicks={[0, 0.5, 1, 1.5]} yTicks={[0, E_G]}>
        {({ x, y }) => <>
          <rect x={x(0)} y={y(E_G)} width={x(1.5) - x(0)} height={y(0) - y(E_G)} fill={C.gap} />
          <path d={areaPath(conductionStates, E_G, x, y)} fill={C.conduction} opacity={0.18} />
          <path d={areaPath(valenceStates, 0, x, y)} fill={C.valence} opacity={0.18} />
          <path d={areaPath(conductionElectrons, E_G, x, y)} fill={C.electron} opacity={0.86} />
          <path d={areaPath(valenceElectrons, 0, x, y)} fill={C.electron} opacity={0.86} />
          <path d={areaBetweenPath(valenceElectrons, valenceStates, x, y)} fill={C.hole} opacity={0.9} />
          <LinePath data={conductionStates} x={d => x(d.x)} y={d => y(d.y)} stroke={C.conduction} strokeWidth={2.5} />
          <LinePath data={valenceStates} x={d => x(d.x)} y={d => y(d.y)} stroke="#243c55" strokeWidth={2.5} />
          <line x1={x(0)} x2={x(1.5)} y1={y(fermiLevel)} y2={y(fermiLevel)} stroke={C.muted} strokeWidth={1.6} strokeDasharray="6 5" />
          <text x={x(1.46)} y={y(fermiLevel) - 7} textAnchor="end" fill={C.muted} className="plot-annotation">E<tspan baselineShift="sub">F</tspan></text>
        </>}
      </Plot>
      <Plot xDomain={[0, 1]} yDomain={[-0.72, 1.82]} xLabel="Probabilitat" yLabel="Energia E (eV)" xTicks={[0, 0.5, 1]} yTicks={[0, E_G]}>
        {({ x, y }) => <>
          <LinePath data={distribution} x={d => x(d.occupation)} y={d => y(d.energy)} stroke={C.fermi} strokeWidth={3} />
          <LinePath data={distribution} x={d => x(d.vacancy)} y={d => y(d.energy)} stroke={C.hole} strokeWidth={3} />
          <line x1={x(0)} x2={x(1)} y1={y(fermiLevel)} y2={y(fermiLevel)} stroke={C.muted} strokeWidth={1.7} strokeDasharray="6 5" />
          <circle cx={x(0.5)} cy={y(fermiLevel)} r={4.5} fill={C.muted} stroke="white" strokeWidth={1.5} />
          <text x={x(0.96)} y={y(fermiLevel) - 8} textAnchor="end" fill={C.muted} className="plot-annotation">E<tspan baselineShift="sub">F</tspan></text>
        </>}
      </Plot>
    </div>
  </Card>;
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
  const [logDonors, setLogDonors] = useState(14);
  const [logNc300, setLogNc300] = useState(Math.log10(NC_300));
  const [logNv300, setLogNv300] = useState(Math.log10(NV_300));
  const [temperature, setTemperature] = useState(300);
  const donors = 10 ** logDonors;
  const nc300 = 10 ** logNc300;
  const nv300 = 10 ** logNv300;
  const intrinsicAt = (t: number) => Math.sqrt(nc300 * nv300) * (t / 300) ** 1.5 * Math.exp(-E_G / (2 * K_B_EV * t));
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
  let lowTemperature = 45;
  let highTemperature = 900;
  let intrinsicBoundary = 1;
  if (intrinsicAt(highTemperature) >= donors) {
    for (let i = 0; i < 50; i++) {
      const midTemperature = (lowTemperature + highTemperature) / 2;
      if (intrinsicAt(midTemperature) >= donors) highTemperature = midTemperature;
      else lowTemperature = midTemperature;
    }
    intrinsicBoundary = 1000 / highTemperature;
  }
  const firstMostlyIonizedTemperature = transport.find(d => d.ionizedDonors / donors >= 0.9)?.t;
  const freezeOutBoundary = firstMostlyIonizedTemperature === undefined
    ? 24
    : Math.max(intrinsicBoundary, Math.min(24, 1000 / firstMostlyIonizedTemperature));
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
    <Plot xDomain={[1, 24]} yDomain={[12, 20]} xLabel="1000/T (10³ K⁻¹)" yLabel="log₁₀ concentració (cm⁻³)" xTicks={[2, 5, 10, 15, 20]} yTicks={[12, 14, 16, 18, 20]}>
      {({ x, y, height }) => <>
        <rect x={x(1)} y={0} width={x(intrinsicBoundary) - x(1)} height={height} fill={C.teal} opacity={0.08} />
        <rect x={x(intrinsicBoundary)} y={0} width={x(freezeOutBoundary) - x(intrinsicBoundary)} height={height} fill={C.conduction} opacity={0.07} />
        <rect x={x(freezeOutBoundary)} y={0} width={x(24) - x(freezeOutBoundary)} height={height} fill={C.electron} opacity={0.06} />
        {intrinsicBoundary > 1.25 && <text x={x((1 + intrinsicBoundary) / 2)} y={y(19)} textAnchor="middle" className="plot-annotation" fill={C.teal}>Intrínsec</text>}
        {freezeOutBoundary - intrinsicBoundary > 1.1 && <text x={x((intrinsicBoundary + freezeOutBoundary) / 2)} y={y(19)} textAnchor="middle" className="plot-annotation" fill={C.conduction}>Saturació · n ≈ Nᴅ⁺</text>}
        {freezeOutBoundary < 22.5 && <text x={x((freezeOutBoundary + 24) / 2)} y={y(19)} textAnchor="middle" className="plot-annotation" fill={C.electron}>Impureses · congelació</text>}
        {carrierSeries.map(line => <LinePath key={line.color} data={line.data} x={d => x(d.x)} y={d => y(d.y)} stroke={line.color} strokeWidth={line.width} strokeDasharray={line.dashed ? '6 4' : undefined} />)}
        <line x1={x(1000 / temperature)} x2={x(1000 / temperature)} y1={y(12)} y2={y(20)} stroke={C.muted} strokeWidth={1.5} strokeDasharray="5 5" opacity={0.8} />
      </>}
    </Plot>
    <div className="metric"><span>Nivell de Fermi E_F</span><strong>{selectedState.fermiLevel.toFixed(3)} eV</strong><span>Fracció ionitzada Nᴅ⁺/Nᴅ</span><strong>{(100 * selectedState.ionizedDonors / donors).toFixed(2)} %</strong><span>Nᴅ⁺</span><strong>{selectedState.ionizedDonors.toExponential(2)} cm⁻³</strong><span>M_C(T) / M_V(T)</span><strong>{selectedState.ncT.toExponential(2)} / {selectedState.nvT.toExponential(2)} cm⁻³</strong></div>
    <p className="insight">D’esquerra a dreta: règim intrínsec (T alta), saturació amb n ≈ Nᴅ⁺ gairebé constant i congelació d’impureses, on els portadors tornen a disminuir. L’eix X augmenta cap a temperatures més baixes.</p>
    <Equation math="M_{C,V}(T)=M_{C,V}(300)\left(\frac{T}{300}\right)^{3/2},\qquad n=p+N_D^+" />
    <Equation math="n=M_C(T)e^{-(E_C-E_F)/(kT)},\quad p=M_V(T)e^{-(E_F-E_V)/(kT)},\quad \frac{N_D^+}{N_D}=\frac{1}{1+2e^{(E_F-E_D)/(kT)}}" />
    <Equation math="m_{\mathrm{intr}}=\frac{d\log_{10}n_i}{d(1000/T)}\simeq-\frac{E_g}{2000k_B\ln 10}\approx-2.82\ \frac{\text{dècades}}{10^3\,\mathrm{K}^{-1}}" />
    <Equation math="n\propto e^{-(E_C-E_D)/(2k_BT)}\quad\Longrightarrow\quad m_{\mathrm{imp}}\simeq-\frac{E_C-E_D}{2000k_B\ln 10}\approx-0.11\ \frac{\text{dècades}}{10^3\,\mathrm{K}^{-1}}\quad(E_C-E_D=0.045\,\mathrm{eV})" />
  </Card>;
}
