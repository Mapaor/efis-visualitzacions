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

function fermiVacancy(energy: number, temperature: number, fermiLevel: number) {
  if (temperature <= 0) return energy < fermiLevel ? 0 : energy > fermiLevel ? 1 : 0.5;
  const exponent = Math.max(-60, Math.min(60, (fermiLevel - energy) / (K_B_EV * temperature)));
  return 1 / (1 + Math.exp(exponent));
}

function integrateArea(points: DosPoint[]) {
  return points.slice(1).reduce((sum, point, index) => {
    const previous = points[index];
    return sum + (point.x + previous.x) / 2 * Math.abs(point.y - previous.y);
  }, 0);
}

export function BandAndDos({ electronMass, holeMass, setElectronMass, setHoleMass }: {
  electronMass: number;
  holeMass: number;
  setElectronMass: (value: number) => void;
  setHoleMass: (value: number) => void;
}) {
  const energies = sample(80, 0, 1);
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
    x: point.x * (1 - carrierFraction(fermiVacancy(point.y, temperature, fermiLevel))),
    y: point.y,
  }));
  const valenceHoles = valenceStates.map(point => ({
    x: point.x * carrierFraction(fermiVacancy(point.y, temperature, fermiLevel)),
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
  // Negative slider values are donor doping (n-type); positive values are acceptor doping (p-type).
  const netDoping = -dopingPosition / 20 * 1e18;
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
    x: point.x * (1 - carrierFraction(fermiVacancy(point.y, temperature, fermiLevel))),
    y: point.y,
  }));
  const valenceHoles = valenceStates.map(point => ({
    x: point.x * carrierFraction(fermiVacancy(point.y, temperature, fermiLevel)),
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
  const spectralSamples = sample(240, 0, 1);
  // A cosine-shaped cutoff gives the far end a visible rounded return to zero.
  const spectralShape = (z: number) => Math.exp(-2.1 * z) * Math.sin((1 - z) * Math.PI / 2) ** 2;
  const rawElectronProfile = spectralSamples.map(z => ({ x: spectralShape(z), y: E_G + 0.65 * z }));
  const rawHoleProfile = spectralSamples.map(z => ({ x: spectralShape(z), y: -0.65 * z }));
  const electronProfileArea = integrateArea(rawElectronProfile);
  const holeProfileArea = integrateArea(rawHoleProfile);
  const electronSpectrum = rawElectronProfile.map(point => ({ ...point, x: point.x * electrons / electronProfileArea }));
  const holeSpectrum = rawHoleProfile.map(point => ({ ...point, x: point.x * holes / holeProfileArea }));
  const spectrumMax = Math.max(...electronSpectrum.map(point => point.x), ...holeSpectrum.map(point => point.x)) * 1.12;

  return <Card tag="SEMICONDUCTOR EXTRÍNSEC · T = 900 K" title="Dopatge, portadors i nivell de Fermi">
    <Range label="Dopatge · tipus n ← intrínsec → tipus p" value={dopingPosition} min={-20} max={20} step={1} onChange={setDopingPosition} formatValue={() => dopingLabel} />
    <div className="insight"><strong>{semiconductorType}</strong> · n = {electrons.toExponential(2)} cm⁻³, p = {holes.toExponential(2)} cm⁻³. E<sub>F</sub> = {fermiLevel.toFixed(3)} eV.</div>
    <div className="chart-legend" aria-label="Llegenda de densitats espectrals de portadors">
      <span><i className="legend-area" style={{ background: C.electron }} />Electrons n(E) · àrea = n</span>
      <span><i className="legend-area" style={{ background: C.hole }} />Forats p(E) · àrea = p</span>
      <span><i className="legend-line" style={{ borderColor: C.fermi }} />f(E)</span>
      <span><i className="legend-line" style={{ borderColor: C.hole }} />1 − f(E)</span>
    </div>
    <div className="plot-pair">
      <Plot xDomain={[0, spectrumMax]} yDomain={[-0.72, 1.82]} xLabel="Densitat espectral n(E) | p(E) (cm⁻³ eV⁻¹)" yLabel="Energia E (eV)" xTicks={[0, spectrumMax / 2, spectrumMax]} xFormat={value => value === 0 ? '0' : value.toExponential(1)} yTicks={[0, E_G]}>
        {({ x, y }) => <>
          <rect x={x(0)} y={y(E_G)} width={x(spectrumMax) - x(0)} height={y(0) - y(E_G)} fill={C.gap} />
          <path d={areaPath(electronSpectrum, E_G, x, y)} fill={C.electron} opacity={0.65} />
          <path d={areaPath(holeSpectrum, 0, x, y)} fill={C.hole} opacity={0.65} />
          <LinePath data={electronSpectrum} x={d => x(d.x)} y={d => y(d.y)} stroke={C.electron} strokeWidth={2.5} />
          <LinePath data={holeSpectrum} x={d => x(d.x)} y={d => y(d.y)} stroke={C.hole} strokeWidth={2.5} />
          <line x1={x(0)} x2={x(spectrumMax)} y1={y(fermiLevel)} y2={y(fermiLevel)} stroke={C.muted} strokeWidth={1.6} strokeDasharray="6 5" />
          <text x={x(spectrumMax * 0.97)} y={y(fermiLevel) - 7} textAnchor="end" fill={C.muted} className="plot-annotation">E<tspan baselineShift="sub">F</tspan></text>
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

export function FermiTemperatureShift() {
  const [dopantType, setDopantType] = useState<'n' | 'p'>('n');
  const temperatureSamples = sample(180, 1, 800);
  const dopings = [13, 14, 15, 16, 17, 18, 19].map(exponent => 10 ** exponent);
  const colors = [C.electron, C.conduction, C.teal, C.fermi, C.hole, C.purple, C.ink];
  const referenceDos300 = Math.sqrt(NC_300 * NV_300);
  const fermiOffsetAt = (temperature: number, doping: number) => {
    const kT = K_B_EV * temperature;
    const nc = referenceDos300 * (temperature / 300) ** 1.5;
    const nv = nc;
    const donorLevel = E_G - 0.045;
    const acceptorLevel = 0.045;
    const atFermi = (fermiLevel: number) => {
      const n = nc * Math.exp(Math.max(-700, Math.min(40, (fermiLevel - E_G) / kT)));
      const p = nv * Math.exp(Math.max(-700, Math.min(40, -fermiLevel / kT)));
      const donorsIonized = dopantType === 'n'
        ? doping / (1 + 2 * Math.exp(Math.max(-700, Math.min(700, (fermiLevel - donorLevel) / kT))))
        : 0;
      const acceptorsIonized = dopantType === 'p'
        ? doping / (1 + 2 * Math.exp(Math.max(-700, Math.min(700, (acceptorLevel - fermiLevel) / kT))))
        : 0;
      return n + acceptorsIonized - p - donorsIonized;
    };
    let lowFermi = -0.2;
    let highFermi = 1.32;
    for (let i = 0; i < 80; i++) {
      const midFermi = (lowFermi + highFermi) / 2;
      if (atFermi(midFermi) > 0) highFermi = midFermi;
      else lowFermi = midFermi;
    }
    return (lowFermi + highFermi) / 2 - E_G / 2;
  };
  const curves = dopings.map((doping, index) => ({
    doping,
    color: colors[index],
    data: temperatureSamples.map(temperature => ({ x: temperature, y: fermiOffsetAt(temperature, doping) })),
  }));
  const donorOffset = E_G / 2 - 0.045;

  return <Card tag="NIVELL DE FERMI · DOPATGE" title="Desplaçament E_F − E_i en funció de la temperatura">
    <div className="dopant-switch" role="group" aria-label="Tipus de dopatge">
      <button type="button" aria-pressed={dopantType === 'n'} onClick={() => setDopantType('n')}>Tipus n</button>
      <button type="button" aria-pressed={dopantType === 'p'} onClick={() => setDopantType('p')}>Tipus p</button>
    </div>
    <div className="chart-legend" aria-label="Concentracions de dopatge">
      {curves.map(curve => <span key={curve.doping}><i className="legend-line" style={{ borderColor: curve.color }} />{curve.doping.toExponential(0).replace('e+', '·10^')} cm⁻³</span>)}
    </div>
    <Plot xDomain={[0, 800]} yDomain={[-0.6, 0.6]} xLabel="Temperatura T (K)" yLabel="E_F − E_i (eV)" xTicks={[0, 200, 400, 600, 800]} yTicks={[-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6]}>
      {({ x, y, height }) => <>
        <rect x={x(0)} y={0} width={x(120) - x(0)} height={height} fill={C.electron} opacity={0.055} />
        <rect x={x(120)} y={0} width={x(600) - x(120)} height={height} fill={C.conduction} opacity={0.05} />
        <rect x={x(600)} y={0} width={x(800) - x(600)} height={height} fill={C.teal} opacity={0.065} />
        <text x={x(60)} y={y(0.55)} textAnchor="middle" className="plot-annotation" fill={C.electron}>Impureses</text>
        <text x={x(360)} y={y(0.55)} textAnchor="middle" className="plot-annotation" fill={C.conduction}>Saturació</text>
        <text x={x(700)} y={y(0.55)} textAnchor="middle" className="plot-annotation" fill={C.teal}>Intrínseca</text>
        {curves.map(curve => <LinePath key={curve.doping} data={curve.data} x={d => x(d.x)} y={d => y(d.y)} stroke={curve.color} strokeWidth={2.4} />)}
        <line x1={x(0)} x2={x(800)} y1={y(donorOffset)} y2={y(donorOffset)} stroke={C.conduction} strokeWidth={1.5} strokeDasharray="6 4" />
        <line x1={x(0)} x2={x(800)} y1={y(-donorOffset)} y2={y(-donorOffset)} stroke={C.hole} strokeWidth={1.5} strokeDasharray="6 4" />
        <text x={x(790)} y={y(donorOffset) - 6} textAnchor="end" className="plot-annotation" fill={C.conduction}>E<tspan baselineShift="sub">D</tspan></text>
        <text x={x(790)} y={y(-donorOffset) - 6} textAnchor="end" className="plot-annotation" fill={C.hole}>E<tspan baselineShift="sub">A</tspan></text>
      </>}
    </Plot>
  </Card>;
}

export function IntrinsicCarriers() {
  const [temperature, setTemperature] = useState(300);
  const count = Math.round(16 * (intrinsicDensity(temperature) / intrinsicDensity(700)) ** 0.35);
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

function ValenceHoles() {
  const [temperature, setTemperature] = useState(300);
  const generatedPairs = Math.min(8, Math.round(8 * (intrinsicDensity(temperature) / intrinsicDensity(700)) ** 0.25));
  const atoms = Array.from({ length: 9 }, (_, index) => ({ index, col: index % 3, row: Math.floor(index / 3), x: 100 + (index % 3) * 200, y: 62 + Math.floor(index / 3) * 100 }));
  const directions = [{ x: 0, y: -25 }, { x: 25, y: 0 }, { x: 0, y: 25 }, { x: -25, y: 0 }];
  const holeAtomOrder = [4, 0, 8, 2, 6, 1, 7, 3, 5];
  const holes = new Set(holeAtomOrder.slice(0, generatedPairs).map((atomIndex, pairIndex) => atomIndex * 4 + (atomIndex + pairIndex) % 4));
  const freeElectronPositions = [
    { x: 61, y: 112 }, { x: 232, y: 35 }, { x: 388, y: 97 }, { x: 548, y: 153 },
    { x: 207, y: 220 }, { x: 386, y: 293 }, { x: 65, y: 284 }, { x: 548, y: 42 },
  ];
  return <>
    <Range label="Temperatura" value={temperature} min={50} max={700} step={10} onChange={setTemperature} formatValue={v => `${v} K`} />
    <p className="plot-caption">Xarxa de 9 àtoms de Si, amb 4 electrons de valència per àtom · T = {temperature} K · {generatedPairs} parelles electró-forat. En cada parella, un electró deixa un enllaç i queda un forat a la capa de valència.</p>
    <svg className="plot-svg" viewBox="0 0 600 340" role="img" aria-label={`Xarxa de nou àtoms de silici a ${temperature} kelvin, amb ${generatedPairs} forats i electrons lliures`}>
      <g stroke="#cbd4df" strokeWidth="2">
        {atoms.filter(atom => atom.col < 2).map(atom => <line key={`h-${atom.index}`} x1={atom.x} y1={atom.y} x2={atom.x + 200} y2={atom.y} />)}
        {atoms.filter(atom => atom.row < 2).map(atom => <line key={`v-${atom.index}`} x1={atom.x} y1={atom.y} x2={atom.x} y2={atom.y + 100} />)}
      </g>
      {atoms.map(atom => <g key={`atom-${atom.index}`}>
        <circle cx={atom.x} cy={atom.y} r={17} fill="#f6f8fb" stroke="#738398" strokeWidth={1.5} />
        <text x={atom.x} y={atom.y + 4} textAnchor="middle" className="plot-annotation">Si</text>
        {directions.map((direction, directionIndex) => {
          const slot = atom.index * 4 + directionIndex;
          return holes.has(slot)
            ? <circle key={slot} cx={atom.x + direction.x} cy={atom.y + direction.y} r={5} fill="white" stroke={C.hole} strokeWidth={2} />
            : <circle key={slot} cx={atom.x + direction.x} cy={atom.y + direction.y} r={4.5} fill={C.valence} stroke="white" strokeWidth={1} />;
        })}
      </g>)}
      {freeElectronPositions.slice(0, generatedPairs).map((point, index) => <g key={`free-${index}`}>
        <circle cx={point.x} cy={point.y} r={6} fill={C.electron} stroke="white" strokeWidth={1.5} />
        <text x={point.x + 8} y={point.y + 4} className="plot-annotation" fill={C.electron}>e⁻</text>
      </g>)}
    </svg>
    <div className="chart-legend" aria-label="Llegenda dels electrons i forats">
      <span><i className="legend-area" style={{ background: C.valence }} />Electró enllaçat</span>
      <span><i className="legend-area" style={{ background: 'white', border: `2px solid ${C.hole}` }} />Forat a l’enllaç</span>
      <span><i className="legend-area" style={{ background: C.electron }} />Electró lliure</span>
    </div>
  </>;
}

const holeMotionPath = [
  { atom: 0, direction: 1 }, { atom: 1, direction: 3 },
  { atom: 1, direction: 2 }, { atom: 4, direction: 0 },
  { atom: 4, direction: 3 }, { atom: 3, direction: 1 },
  { atom: 3, direction: 2 }, { atom: 6, direction: 0 },
  { atom: 6, direction: 1 }, { atom: 7, direction: 3 },
  { atom: 7, direction: 0 }, { atom: 4, direction: 2 },
  { atom: 4, direction: 1 }, { atom: 5, direction: 3 },
  { atom: 5, direction: 2 }, { atom: 8, direction: 0 },
  { atom: 8, direction: 1 }, { atom: 8, direction: 3 },
  { atom: 7, direction: 1 }, { atom: 7, direction: 0 },
  { atom: 4, direction: 2 }, { atom: 4, direction: 0 },
  { atom: 1, direction: 2 }, { atom: 1, direction: 3 },
  { atom: 0, direction: 1 }, { atom: 0, direction: 2 },
];

const freeElectronFrames = Array.from({ length: 26 }, (_, index) => ({
  x: 160 + index * 4.8 + 2.2 * Math.sin(index * 1.3),
  y: 112 + 8 * Math.sin(index * 0.85) + 3 * Math.cos(index * 0.47),
}));

function HoleMotion() {
  const [step, setStep] = useState(0);
  const atoms = Array.from({ length: 9 }, (_, index) => ({ index, col: index % 3, row: Math.floor(index / 3), x: 100 + (index % 3) * 200, y: 62 + Math.floor(index / 3) * 100 }));
  const directions = [{ x: 0, y: -25 }, { x: 25, y: 0 }, { x: 0, y: 25 }, { x: -25, y: 0 }];
  const slotPoint = (slot: { atom: number; direction: number }) => {
    const atom = atoms[slot.atom];
    const direction = directions[slot.direction];
    return { x: atom.x + direction.x, y: atom.y + direction.y };
  };
  const hole = holeMotionPath[step];
  const electron = holeMotionPath[step + 1];
  const holePoint = slotPoint(hole);
  const electronPoint = electron ? slotPoint(electron) : null;
  const sameAtom = electron !== undefined && hole.atom === electron.atom;
  const arrowPath = electronPoint && (sameAtom
    ? `M ${electronPoint.x} ${electronPoint.y} Q ${atoms[hole.atom].x} ${atoms[hole.atom].y - 36} ${holePoint.x} ${holePoint.y}`
    : `M ${electronPoint.x} ${electronPoint.y} L ${holePoint.x} ${holePoint.y}`);

  return <Card tag="TRANSPORT DE FORATS · MODEL ESQUEMÀTIC" title="Moviment dels forats a la xarxa de silici">
    <p className="plot-caption">Un electró d’un enllaç veí salta per omplir el forat. El forat queda a l’enllaç que l’electró ha deixat, així que sembla que es desplaça en sentit contrari.</p>
    <Range label="Temps" value={step} min={0} max={holeMotionPath.length - 1} step={1} onChange={setStep} formatValue={value => `pas ${value + 1} / ${holeMotionPath.length}`} />
    <svg className="plot-svg" viewBox="0 0 600 340" role="img" aria-label={`Xarxa de silici amb un forat a l'enllaç ${step + 1} de ${holeMotionPath.length}`}>
      <defs>
        <marker id="hole-motion-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L8,4 L0,8 z" fill={C.electron} />
        </marker>
      </defs>
      <g stroke="#cbd4df" strokeWidth="2">
        {atoms.filter(atom => atom.col < 2).map(atom => <line key={`h-${atom.index}`} x1={atom.x} y1={atom.y} x2={atom.x + 200} y2={atom.y} />)}
        {atoms.filter(atom => atom.row < 2).map(atom => <line key={`v-${atom.index}`} x1={atom.x} y1={atom.y} x2={atom.x} y2={atom.y + 100} />)}
      </g>
      {arrowPath && <path d={arrowPath} fill="none" stroke={C.electron} strokeWidth={2} strokeDasharray="5 4" markerEnd="url(#hole-motion-arrow)" />}
      {atoms.map(atom => <g key={`atom-${atom.index}`}>
        <circle cx={atom.x} cy={atom.y} r={17} fill="#f6f8fb" stroke="#738398" strokeWidth={1.5} />
        <text x={atom.x} y={atom.y + 4} textAnchor="middle" className="plot-annotation">Si</text>
        {directions.map((direction, directionIndex) => {
          const isHole = hole.atom === atom.index && hole.direction === directionIndex;
          const isIncoming = electron !== undefined && electron.atom === atom.index && electron.direction === directionIndex;
          const cx = atom.x + direction.x;
          const cy = atom.y + direction.y;
          return isHole
            ? <g key={`${atom.index}-${directionIndex}`}><circle cx={cx} cy={cy} r={8} fill="white" stroke={C.hole} strokeWidth={2.5} /><text x={cx + 10} y={cy + 4} className="plot-annotation" fill={C.hole}>h⁺</text></g>
            : <g key={`${atom.index}-${directionIndex}`}><circle cx={cx} cy={cy} r={isIncoming ? 6 : 4.5} fill={isIncoming ? C.electron : C.valence} stroke="white" strokeWidth={1} />{isIncoming && <text x={cx + 9} y={cy - 7} className="plot-annotation" fill={C.electron}>e⁻</text>}</g>;
        })}
      </g>)}
    </svg>
    <div className="chart-legend" aria-label="Llegenda del moviment del forat">
      <span><i className="legend-area" style={{ background: C.valence }} />Electrons enllaçats</span>
      <span><i className="legend-area" style={{ background: 'white', border: `2px solid ${C.hole}` }} />Forat</span>
      <span><i className="legend-area" style={{ background: C.electron }} />Electró que salta</span>
    </div>
  </Card>;
}

function FreeElectronMotion() {
  const [step, setStep] = useState(0);
  const atoms = Array.from({ length: 9 }, (_, index) => ({ index, col: index % 3, row: Math.floor(index / 3), x: 100 + (index % 3) * 200, y: 62 + Math.floor(index / 3) * 100 }));
  const directions = [{ x: 0, y: -25 }, { x: 25, y: 0 }, { x: 0, y: 25 }, { x: -25, y: 0 }];
  const electron = freeElectronFrames[step];
  const trail = freeElectronFrames.slice(Math.max(0, step - 4), step);

  return <Card tag="TRANSPORT D’ELECTRONS · MODEL ESQUEMÀTIC" title="Moviment dels electrons lliures">
    <p className="plot-caption">L’electró lliure es desplaça a petits salts entre els àtoms. Les marques més pàl·lides indiquen algunes de les seves posicions immediatament anteriors.</p>
    <Range label="Temps" value={step} min={0} max={freeElectronFrames.length - 1} step={1} onChange={setStep} formatValue={value => `pas ${value + 1} / ${freeElectronFrames.length}`} />
    <svg className="plot-svg" viewBox="0 0 600 340" role="img" aria-label={`Electró lliure a la posició ${step + 1} de ${freeElectronFrames.length} dins una xarxa de silici`}>
      <g stroke="#cbd4df" strokeWidth="2">
        {atoms.filter(atom => atom.col < 2).map(atom => <line key={`h-${atom.index}`} x1={atom.x} y1={atom.y} x2={atom.x + 200} y2={atom.y} />)}
        {atoms.filter(atom => atom.row < 2).map(atom => <line key={`v-${atom.index}`} x1={atom.x} y1={atom.y} x2={atom.x} y2={atom.y + 100} />)}
      </g>
      {atoms.map(atom => <g key={`atom-${atom.index}`}>
        <circle cx={atom.x} cy={atom.y} r={17} fill="#f6f8fb" stroke="#738398" strokeWidth={1.5} />
        <text x={atom.x} y={atom.y + 4} textAnchor="middle" className="plot-annotation">Si</text>
        {directions.map((direction, directionIndex) => <circle key={`${atom.index}-${directionIndex}`} cx={atom.x + direction.x} cy={atom.y + direction.y} r={4.5} fill={C.valence} stroke="white" strokeWidth={1} />)}
      </g>)}
      {trail.map((position, index) => <circle key={`trail-${step - trail.length + index}`} cx={position.x} cy={position.y} r={5 + index * 0.5} fill={C.electron} opacity={0.14 + index * 0.12} />)}
      <circle cx={electron.x} cy={electron.y} r={8} fill={C.electron} stroke="white" strokeWidth={2} />
      <text x={electron.x + 12} y={electron.y - 8} className="plot-annotation" fill={C.electron}>e⁻ lliure</text>
    </svg>
    <div className="chart-legend" aria-label="Llegenda del moviment dels electrons">
      <span><i className="legend-area" style={{ background: C.valence }} />Electrons enllaçats</span>
      <span><i className="legend-area" style={{ background: C.electron }} />Electró lliure i posicions recents</span>
    </div>
  </Card>;
}

const recombinationHolePath = [
  ...holeMotionPath.slice(0, 10),
  { atom: 7, direction: 0 }, { atom: 4, direction: 2 },
  { atom: 4, direction: 3 }, { atom: 4, direction: 0 },
  { atom: 4, direction: 2 }, { atom: 4, direction: 1 },
  { atom: 4, direction: 0 }, { atom: 4, direction: 3 },
  { atom: 4, direction: 2 }, { atom: 4, direction: 0 },
  { atom: 4, direction: 3 }, { atom: 4, direction: 2 },
  { atom: 4, direction: 0 }, { atom: 4, direction: 1 },
  { atom: 4, direction: 1 }, { atom: 4, direction: 1 },
];

function Recombination() {
  const [step, setStep] = useState(0);
  const atoms = Array.from({ length: 9 }, (_, index) => ({ index, col: index % 3, row: Math.floor(index / 3), x: 100 + (index % 3) * 200, y: 62 + Math.floor(index / 3) * 100 }));
  const directions = [{ x: 0, y: -25 }, { x: 25, y: 0 }, { x: 0, y: 25 }, { x: -25, y: 0 }];
  const slotPoint = (slot: { atom: number; direction: number }) => {
    const atom = atoms[slot.atom];
    const direction = directions[slot.direction];
    return { x: atom.x + direction.x, y: atom.y + direction.y };
  };
  const lastStep = recombinationHolePath.length - 1;
  const hole = recombinationHolePath[step];
  const holePoint = slotPoint(hole);
  const progress = step / lastStep;
  const electron = { x: 205 + (holePoint.x - 205) * progress, y: 245 + (holePoint.y - 245) * progress };
  const trailStart = Math.max(0, step - 3);
  const trail = Array.from({ length: step - trailStart }, (_, index) => {
    const frame = trailStart + index;
    const position = slotPoint(recombinationHolePath[frame]);
    const frameProgress = frame / lastStep;
    return { x: 205 + (position.x - 205) * frameProgress, y: 245 + (position.y - 245) * frameProgress };
  });
  const recombined = step === lastStep;

  return <Card tag="RECOMBINACIÓ · MODEL ESQUEMÀTIC" title="Recombinació">
    <p className="plot-caption">El forat es desplaça per la xarxa mentre l’electró lliure s’hi acosta. En l’últim pas, l’electró ocupa l’enllaç buit i la parella es recombina.</p>
    <Range label="Temps" value={step} min={0} max={lastStep} step={1} onChange={setStep} formatValue={value => `pas ${value + 1} / ${lastStep + 1}`} />
    <svg className="plot-svg" viewBox="0 0 600 340" role="img" aria-label={recombined ? 'L’electró lliure ha ocupat el forat: recombinació completa' : `Forat i electró lliure en moviment, pas ${step + 1} de ${lastStep + 1}`}>
      <g stroke="#cbd4df" strokeWidth="2">
        {atoms.filter(atom => atom.col < 2).map(atom => <line key={`h-${atom.index}`} x1={atom.x} y1={atom.y} x2={atom.x + 200} y2={atom.y} />)}
        {atoms.filter(atom => atom.row < 2).map(atom => <line key={`v-${atom.index}`} x1={atom.x} y1={atom.y} x2={atom.x} y2={atom.y + 100} />)}
      </g>
      {atoms.map(atom => <g key={`atom-${atom.index}`}>
        <circle cx={atom.x} cy={atom.y} r={17} fill="#f6f8fb" stroke="#738398" strokeWidth={1.5} />
        <text x={atom.x} y={atom.y + 4} textAnchor="middle" className="plot-annotation">Si</text>
        {directions.map((direction, directionIndex) => {
          const isHole = !recombined && hole.atom === atom.index && hole.direction === directionIndex;
          const isRecombinedSlot = recombined && hole.atom === atom.index && hole.direction === directionIndex;
          const cx = atom.x + direction.x;
          const cy = atom.y + direction.y;
          return isHole
            ? <g key={`${atom.index}-${directionIndex}`}><circle cx={cx} cy={cy} r={8} fill="white" stroke={C.hole} strokeWidth={2.5} /><text x={cx + 10} y={cy + 4} className="plot-annotation" fill={C.hole}>h⁺</text></g>
            : <g key={`${atom.index}-${directionIndex}`}><circle cx={cx} cy={cy} r={isRecombinedSlot ? 6.5 : 4.5} fill={isRecombinedSlot ? C.electron : C.valence} stroke="white" strokeWidth={1} />{isRecombinedSlot && <text x={cx + 9} y={cy - 7} className="plot-annotation" fill={C.electron}>e⁻ capturat</text>}</g>;
        })}
      </g>)}
      {trail.map((position, index) => <circle key={`trail-${step - trail.length + index}`} cx={position.x} cy={position.y} r={5 + index * 0.5} fill={C.electron} opacity={0.14 + index * 0.12} />)}
      {!recombined && <><circle cx={electron.x} cy={electron.y} r={8} fill={C.electron} stroke="white" strokeWidth={2} /><text x={electron.x + 12} y={electron.y - 8} className="plot-annotation" fill={C.electron}>e⁻ lliure</text></>}
    </svg>
    <p className="plot-caption">{recombined ? 'Pas final: l’electró ocupa el forat i desapareixen tots dos portadors.' : `Pas ${step + 1}: encara hi ha un forat i un electró lliure; l’electró s’hi va acostant.`}</p>
    <div className="chart-legend" aria-label="Llegenda de recombinació">
      <span><i className="legend-area" style={{ background: C.valence }} />Electrons enllaçats</span>
      <span><i className="legend-area" style={{ background: 'white', border: `2px solid ${C.hole}` }} />Forat</span>
      <span><i className="legend-area" style={{ background: C.electron }} />Electró lliure</span>
    </div>
  </Card>;
}

function GenerationRecombination() {
  const initialTemperature = 300;
  const [finalTemperature, setFinalTemperature] = useState(500);
  const logPairChange = Math.log(intrinsicDensity(finalTemperature)) - Math.log(intrinsicDensity(initialTemperature));
  const initialRate = 5;
  const finalRate = initialRate * Math.exp(Math.max(-Math.log(1.8), Math.min(Math.log(1.8), 0.1 * logPairChange)));
  const times = sample(160, -2, 10);
  const generation = [{ x: -2, y: initialRate }, { x: 0, y: initialRate }, { x: 0, y: finalRate }, { x: 10, y: finalRate }];
  const recombination = times.map(time => ({ x: time, y: time <= 0 ? initialRate : finalRate + (initialRate - finalRate) * Math.exp(-time / 2.2) }));

  return <Card tag="DINÀMICA DE PORTADORS · MODEL ESQUEMÀTIC" title="Generació i recombinació">
    <Range label="Temperatura final" value={finalTemperature} min={50} max={700} step={10} onChange={setFinalTemperature} formatValue={value => `${value} K`} />
    <p className="plot-caption">Es parteix de l’equilibri a T = {initialTemperature} K. A t = 0, la temperatura canvia bruscament: la generació salta al nou valor i la recombinació s’hi acosta gradualment. A l’equilibri, G = R.</p>
    <div className="chart-legend" aria-label="Llegenda de generació i recombinació">
      <span><i className="legend-line" style={{ borderColor: C.electron }} />Generació G</span>
      <span><i className="legend-line" style={{ borderColor: C.hole }} />Recombinació R</span>
    </div>
    <Plot xDomain={[-2, 10]} yDomain={[0, 10]} xLabel="Temps després del canvi de temperatura (τ)" yLabel="Taxa relativa de parelles" xTicks={[-2, 0, 2, 4, 6, 8, 10]} yTicks={[0, 2, 4, 5, 6, 8, 10]}>
      {({ x, y, height }) => <>
        <rect x={x(0)} y={0} width={x(10) - x(0)} height={height} fill={C.teal} opacity={0.045} />
        <LinePath data={generation} x={point => x(point.x)} y={point => y(point.y)} stroke={C.electron} strokeWidth={2.7} />
        <LinePath data={recombination} x={point => x(point.x)} y={point => y(point.y)} stroke={C.hole} strokeWidth={2.7} />
        <line x1={x(0)} x2={x(0)} y1={y(0)} y2={y(10)} stroke={C.muted} strokeWidth={1.4} strokeDasharray="5 4" />
        <text x={x(0) + 5} y={y(9.4)} className="plot-annotation" fill={C.muted}>canvi T</text>
      </>}
    </Plot>
    <p className="plot-caption">Taxes relatives a l’equilibri inicial, amb la variació final comprimida esquemàticament. Si T inicial = T final, G i R coincideixen en una sola línia horitzontal.</p>
  </Card>;
}

function CarrierEnergyDistribution() {
  const [temperature, setTemperature] = useState(700);
  const ncT = NC_300 * (temperature / 300) ** 1.5;
  const nvT = NV_300 * (temperature / 300) ** 1.5;
  const intrinsic = Math.sqrt(ncT * nvT) * Math.exp(-E_G / (2 * K_B_EV * temperature));
  const energies = sample(240, 0, 1);
  const rawElectrons = energies.map(z => {
    const energy = E_G + 0.65 * z;
    const tail = Math.exp(-2.1 * z) * Math.sin((1 - z) * Math.PI / 2) ** 2;
    return { x: tail, y: energy };
  });
  const rawHoles = energies.map(z => {
    const energy = -0.65 * z;
    const tail = Math.exp(-2.1 * z) * Math.sin((1 - z) * Math.PI / 2) ** 2;
    return { x: tail, y: energy };
  });
  const electronArea = integrateArea(rawElectrons);
  const holeArea = integrateArea(rawHoles);
  const electrons = rawElectrons.map(point => ({ ...point, x: point.x * intrinsic / electronArea }));
  const holes = rawHoles.map(point => ({ ...point, x: point.x * intrinsic / holeArea }));
  const referenceNc = NC_300 * (700 / 300) ** 1.5;
  const referenceNv = NV_300 * (700 / 300) ** 1.5;
  const referenceIntrinsic = Math.sqrt(referenceNc * referenceNv) * Math.exp(-E_G / (2 * K_B_EV * 700));
  const maxDensity = referenceIntrinsic / electronArea * 1.15;
  return <Card tag="DISTRIBUCIÓ ESPECTRAL DE PORTADORS" title="Energia E en funció de n(E) i p(E)">
    <Range label="Temperatura" value={temperature} min={50} max={700} step={10} onChange={setTemperature} formatValue={value => `${value} K`} />
    <p className="plot-caption">Esquema pedagògic a T = {temperature} K · cada perfil comença ample prop de la banda i s’afina fins a reposar a zero; l’àrea de cada color representa el total de portadors (n = p = nᵢ).</p>
    <div className="chart-legend" aria-label="Llegenda de portadors segons l’energia">
      <span><i className="legend-area" style={{ background: C.electron }} />Electrons n(E)</span>
      <span><i className="legend-area" style={{ background: C.hole }} />Forats p(E)</span>
    </div>
    <Plot xDomain={[0, maxDensity]} yDomain={[-0.72, 1.82]} xLabel="Densitat espectral n(E) | p(E) (cm⁻³ eV⁻¹)" yLabel="Energia E (eV)" xTicks={[0, maxDensity / 2, maxDensity]} xFormat={value => value === 0 ? '0' : value.toExponential(1)} yTicks={[0, E_G]}>
      {({ x, y }) => <>
        <rect x={x(0)} y={y(E_G)} width={x(maxDensity) - x(0)} height={y(0) - y(E_G)} fill={C.gap} />
        <path d={areaPath(electrons, E_G, x, y)} fill={C.electron} opacity={0.65} />
        <path d={areaPath(holes, 0, x, y)} fill={C.hole} opacity={0.65} />
        <LinePath data={electrons} x={d => x(d.x)} y={d => y(d.y)} stroke={C.electron} strokeWidth={2.5} />
        <LinePath data={holes} x={d => x(d.x)} y={d => y(d.y)} stroke={C.hole} strokeWidth={2.5} />
        <text x={x(electrons[0].x * 0.08)} y={y(E_G + 0.16)} className="plot-annotation" fill={C.electron}>n(E)</text>
        <text x={x(holes[0].x * 0.08)} y={y(-0.16)} className="plot-annotation" fill={C.hole}>p(E)</text>
      </>}
    </Plot>
    <div className="metric"><span>Total electrons n</span><strong>{intrinsic.toExponential(2)} cm⁻³</strong><span>Total forats p</span><strong>{intrinsic.toExponential(2)} cm⁻³</strong></div>
  </Card>;
}

function DensityOfStatesDimensions() {
  const plot = { left: 42, right: 244, top: 30, bottom: 158 };
  const x = (energy: number) => plot.left + ((energy + 0.1) / 1.1) * (plot.right - plot.left);
  const y = (density: number) => plot.bottom - (density / 1.1) * (plot.bottom - plot.top);
  const energySamples = sample(120, 0.02, 1);
  const oneDimensional = energySamples.map(energy => ({ x: energy, y: Math.min(1.05, Math.sqrt(0.04 / energy)) }));
  const threeDimensional = sample(120, 0, 1).map(energy => ({ x: energy, y: Math.sqrt(energy) }));
  const panels = [
    { id: '0d', title: '0D · Punt quàntic', law: 'g(E) ∝ δ(E)', color: C.electron },
    { id: '1d', title: '1D', law: 'g(E) ∝ E⁻¹ᐟ²', color: C.hole },
    { id: '2d', title: '2D', law: 'g(E) ∝ E⁰ = constant', color: C.teal },
    { id: '3d', title: '3D', law: 'g(E) ∝ √E', color: C.conduction },
  ] as const;

  return <Card tag="DENSITAT D’ESTATS · DEPENDÈNCIA DIMENSIONAL" title="Densitat d’estats segons la dimensió">
    <p className="plot-caption">Formes normalitzades des de la vora d’energia E₀; cada mini gràfic mostra la dependència característica de la densitat d’estats.</p>
    <div className="dimension-plots">
      {panels.map(panel => <div className="dimension-panel" key={panel.id}>
        <h4>{panel.title}</h4>
        <svg className="dimension-plot" viewBox="0 0 260 195" role="img" aria-label={`${panel.title}, ${panel.law}`}>
          <g stroke="#e7ebf0" strokeWidth="1">
            {[0.5, 1].map(value => <line key={value} x1={plot.left} x2={plot.right} y1={y(value)} y2={y(value)} />)}
          </g>
          <g stroke="#9ba8b8" strokeWidth="1.2">
            <line x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} />
            <line x1={plot.left} x2={plot.left} y1={plot.top} y2={plot.bottom} />
            <line x1={x(0)} x2={x(0)} y1={plot.bottom} y2={plot.bottom + 4} />
            <line x1={x(1)} x2={x(1)} y1={plot.bottom} y2={plot.bottom + 4} />
          </g>
          <text x={x(0)} y={plot.bottom + 16} textAnchor="middle" className="dimension-axis">E₀</text>
          <text x={x(1)} y={plot.bottom + 16} textAnchor="middle" className="dimension-axis">E</text>
          <text x={plot.left - 7} y={plot.bottom + 3} textAnchor="end" className="dimension-axis">0</text>
          <text x={plot.left - 7} y={y(1) + 3} textAnchor="end" className="dimension-axis">1</text>
          <text transform={`translate(13 ${(plot.top + plot.bottom) / 2}) rotate(-90)`} textAnchor="middle" className="dimension-axis">g(E)</text>
          {panel.id === '0d' && <>
            <line x1={x(0)} x2={x(0)} y1={y(1.02)} y2={plot.bottom} stroke={panel.color} strokeWidth={3} />
            <path d={`M ${x(0) - 5} ${y(1.02) + 8} L ${x(0)} ${y(1.02)} L ${x(0) + 5} ${y(1.02) + 8}`} fill="none" stroke={panel.color} strokeWidth={2} />
          </>}
          {panel.id === '1d' && <>
            <LinePath data={oneDimensional} x={point => x(point.x)} y={point => y(point.y)} stroke={panel.color} strokeWidth={2.7} />
            <path d={`M ${x(0)} ${y(0.88)} L ${x(0)} ${y(1.04)}`} stroke={panel.color} strokeWidth={1.7} />
          </>}
          {panel.id === '2d' && <path d={`M ${x(0)} ${plot.bottom} L ${x(0)} ${y(0.72)} L ${x(1)} ${y(0.72)}`} fill="none" stroke={panel.color} strokeWidth={2.7} />}
          {panel.id === '3d' && <LinePath data={threeDimensional} x={point => x(point.x)} y={point => y(point.y)} stroke={panel.color} strokeWidth={2.7} />}
        </svg>
        <p className="dimension-law" style={{ color: panel.color }}>{panel.law}</p>
      </div>)}
    </div>
  </Card>;
}

export function ThermalStatisticsPanels() {
  const [electronMass, setElectronMass] = useState(1.08);
  const [holeMass, setHoleMass] = useState(0.56);
  return <>
    <div className="grid two lower-grid">
      <Card tag="SEMICONDUCTOR INTRÍNSEC" title="Generació tèrmica de parelles"><IntrinsicCarriers /></Card>
      <Card tag="SEMICONDUCTOR INTRÍNSEC · XARXA 2D" title="Forats a la capa de valència"><ValenceHoles /></Card>
    </div>
    <div className="grid two lower-grid"><HoleMotion /><FreeElectronMotion /></div>
    <div className="grid two lower-grid"><Recombination /><GenerationRecombination /></div>
    <div className="grid two lower-grid">
      <Card tag="DENSITAT D’ESTATS" title="N(E), Nᵥ(E) i N꜀(E)"><BandAndDos electronMass={electronMass} holeMass={holeMass} setElectronMass={setElectronMass} setHoleMass={setHoleMass} /></Card>
      <CarrierEnergyDistribution />
    </div>
    <div className="grid single lower-grid"><DensityOfStatesDimensions /></div>
  </>;
}

export function DopedStatistics() {
  const [showChargeSums, setShowChargeSums] = useState(false);
  const [hideIndividualCurves, setHideIndividualCurves] = useState(false);
  const [logDonors, setLogDonors] = useState(16);
  const [logAcceptors, setLogAcceptors] = useState(15);
  const [logNc300, setLogNc300] = useState(Math.log10(NC_300));
  const [logNv300, setLogNv300] = useState(Math.log10(NV_300));
  const [donorLevel, setDonorLevel] = useState(E_G - 0.045);
  const [acceptorLevel, setAcceptorLevel] = useState(0.045);
  const [temperature, setTemperature] = useState(300);
  const donors = 10 ** logDonors;
  const acceptors = 10 ** logAcceptors;
  const nc300 = 10 ** logNc300;
  const nv300 = 10 ** logNv300;
  const kT = K_B_EV * temperature;
  const ncT = nc300 * (temperature / 300) ** 1.5;
  const nvT = nv300 * (temperature / 300) ** 1.5;
  const ni = Math.sqrt(ncT * nvT) * Math.exp(-E_G / (2 * kT));
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
  const donorIonization = equilibrium.ionizedDonors / donors;
  const acceptorIonization = equilibrium.ionizedAcceptors / acceptors;
  const intrinsicOffset = fermiLevel - intrinsicLevel;
  const carrierRatio = Math.max(equilibrium.n, equilibrium.p) / Math.max(Math.min(equilibrium.n, equilibrium.p), 1);
  const fermiPositionText = Math.abs(intrinsicOffset) < 0.015
    ? `E_F ≈ E_i = ${intrinsicLevel.toFixed(3)} eV`
    : `E_F = ${fermiLevel.toFixed(3)} eV, ${Math.abs(intrinsicOffset).toFixed(3)} eV ${intrinsicOffset > 0 ? 'per sobre' : 'per sota'} d’E_i`;
  const boltzmannValid = Math.min(fermiLevel, E_G - fermiLevel) > 3 * kT;
  let fermiExplanation: string;
  if (intrinsicDominates) {
    fermiExplanation = 'Com que n i p són comparables i el dopatge net és petit, pren n ≈ p ≈ n_i i E_F ≈ E_i.';
  } else if (netIonizedDoping > 0) {
    const ionizationApproximation = donorIonization >= 0.9
      ? `E_F−E_D = ${(fermiLevel - donorLevel).toFixed(3)} eV i Nᴅ⁺/Nᴅ = ${(100 * donorIonization).toFixed(1)}%: aproxima Nᴅ⁺ ≈ Nᴅ.`
      : `Només el ${(100 * donorIonization).toFixed(1)}% dels donadors està ionitzat: conserva Nᴅ⁺ = Nᴅ/[1+2e^{(E_F−E_D)/kT}].`;
    const carrierApproximation = carrierRatio >= 10 && boltzmannValid
      ? `Com que n/p = ${carrierRatio.toFixed(1)}, n domina: usa n ≈ Nᴅ⁺ − Nₐ⁻ i p ≈ n_i²/n.`
      : carrierRatio >= 10
        ? `Com que n/p = ${carrierRatio.toFixed(1)}, n domina: usa n ≈ Nᴅ⁺ − Nₐ⁻, però calcula p amb Fermi-Dirac.`
      : `n/p = ${carrierRatio.toFixed(1)}: p encara no és negligible; conserva n + Nₐ⁻ = p + Nᴅ⁺.`;
    fermiExplanation = `${ionizationApproximation} ${carrierApproximation}`;
  } else {
    const ionizationApproximation = acceptorIonization >= 0.9
      ? `E_A−E_F = ${(acceptorLevel - fermiLevel).toFixed(3)} eV i Nₐ⁻/Nₐ = ${(100 * acceptorIonization).toFixed(1)}%: aproxima Nₐ⁻ ≈ Nₐ.`
      : `Només el ${(100 * acceptorIonization).toFixed(1)}% dels acceptadors està ionitzat: conserva Nₐ⁻ = Nₐ/[1+2e^{(E_A−E_F)/kT}].`;
    const carrierApproximation = carrierRatio >= 10 && boltzmannValid
      ? `Com que p/n = ${carrierRatio.toFixed(1)}, p domina: usa p ≈ Nₐ⁻ − Nᴅ⁺ i n ≈ n_i²/p.`
      : carrierRatio >= 10
        ? `Com que p/n = ${carrierRatio.toFixed(1)}, p domina: usa p ≈ Nₐ⁻ − Nᴅ⁺, però calcula n amb Fermi-Dirac.`
      : `p/n = ${carrierRatio.toFixed(1)}: n encara no és negligible; conserva n + Nₐ⁻ = p + Nᴅ⁺.`;
    fermiExplanation = `${ionizationApproximation} ${carrierApproximation}`;
  }
  const statisticsNote = boltzmannValid
    ? `E_F és a més de 3kT de les bandes; l’aproximació de Boltzmann i n·p ≈ n_i² són adequades.`
    : `E_F és a menys de 3kT d’una banda: caldria deixar Boltzmann i usar estadística de Fermi-Dirac.`;
  const fermiSweep = sample(151, 0, E_G);
  const carrierCurves = fermiSweep.map(ef => ({ x: ef, ...carriersAt(ef) }));
  return <>
    <div className="controls two-controls">
      <Range label="Donadors Nᴅ" value={logDonors} min={12} max={19} step={0.1} onChange={setLogDonors} formatValue={() => `${donors.toExponential(1)} cm⁻³`} />
      <Range label="Acceptadors Nₐ" value={logAcceptors} min={12} max={19} step={0.1} onChange={setLogAcceptors} formatValue={() => `${acceptors.toExponential(1)} cm⁻³`} />
    </div>
    <div className="controls two-controls">
      <Range label={<><i>M</i><sub>C</sub>(300 K) = n(E<sub>C</sub>)</>} value={logNc300} min={18} max={21} step={0.01} onChange={setLogNc300} formatValue={() => `${nc300.toExponential(2)} cm⁻³`} />
      <Range label={<><i>M</i><sub>V</sub>(300 K) = p(E<sub>V</sub>)</>} value={logNv300} min={18} max={21} step={0.01} onChange={setLogNv300} formatValue={() => `${nv300.toExponential(2)} cm⁻³`} />
    </div>
    <div className="controls two-controls">
      <Range label={<><i>E</i><sub>D</sub></>} value={donorLevel} min={E_G - 0.15} max={E_G - 0.01} step={0.001} onChange={setDonorLevel} formatValue={v => `${format(v, 3)} eV`} />
      <Range label={<><i>E</i><sub>A</sub></>} value={acceptorLevel} min={0.01} max={0.15} step={0.001} onChange={setAcceptorLevel} formatValue={v => `${format(v, 3)} eV`} />
    </div>
    <Range label="Temperatura" value={temperature} min={200} max={700} step={10} onChange={setTemperature} formatValue={v => `${v} K`} />
    <div className="charge-sum-controls">
      <label className="charge-sum-toggle">
        <input type="checkbox" checked={showChargeSums} onChange={event => {
          setShowChargeSums(event.target.checked);
          if (!event.target.checked) setHideIndividualCurves(false);
        }} />
        <span>Mostrar suma de portadors i dopants</span>
      </label>
      {showChargeSums && <label className="charge-sum-toggle">
        <input type="checkbox" checked={hideIndividualCurves} onChange={event => setHideIndividualCurves(event.target.checked)} />
        <span>Amagar electrons, forats i dopants</span>
      </label>}
    </div>
    <p className="plot-caption">M<sub>C</sub> fixa el valor de n quan E<sub>F</sub> = E<sub>C</sub>; M<sub>V</sub> fixa p quan E<sub>F</sub> = E<sub>V</sub>. Tots dos valors varien amb la temperatura com T<sup>3/2</sup>.</p>
    <div className="chart-legend" aria-label="Llegenda de concentracions segons el nivell de Fermi">
      {!hideIndividualCurves && <>
        <span><i className="legend-line" style={{ borderColor: C.electron }} />Electrons n</span>
        <span><i className="legend-line" style={{ borderColor: C.hole }} />Forats p</span>
        <span><i className="legend-line" style={{ borderColor: C.conduction }} />Donadors ionitzats Nᴅ⁺</span>
        <span><i className="legend-line" style={{ borderColor: C.purple }} />Acceptadors ionitzats Nₐ⁻</span>
      </>}
      {showChargeSums && <>
        <span><i className="legend-line legend-dashed" style={{ borderColor: '#d97706' }} />p + Nᴅ⁺</span>
        <span><i className="legend-line legend-dashed" style={{ borderColor: '#65a30d' }} />n + Nₐ⁻</span>
      </>}
      <span><i className="legend-line legend-dashed" style={{ borderColor: C.muted }} />Intrínseca nᵢ</span>
      <span><i className="legend-line legend-dashed" style={{ borderColor: C.muted }} />Nivell intrínsec Eᵢ</span>
    </div>
    <Plot xDomain={[0, E_G]} yDomain={[0, 23]} xLabel="Nivell de Fermi E_F: E_V → E_C (eV)" yLabel="log₁₀ concentració (cm⁻³)" xTicks={[0, intrinsicLevel, E_G]} xFormat={value => value === 0 ? 'E_V' : Math.abs(value - intrinsicLevel) < 0.01 ? 'E_i' : 'E_C'} yTicks={[0, 5, 10, 15, 20, 22]}>
        {({ x, y }) => <>
          <rect x={x(0)} y={y(23)} width={x(E_G) - x(0)} height={y(0) - y(23)} fill={C.gap} opacity={0.42} />
          {!hideIndividualCurves && [
            { key: 'n', color: C.electron }, { key: 'p', color: C.hole },
            { key: 'ionizedDonors', color: C.conduction }, { key: 'ionizedAcceptors', color: C.purple },
          ].map(line => <LinePath key={line.key} data={carrierCurves.map(d => ({ x: d.x, y: Math.log10(Math.max(d[line.key as keyof typeof d] as number, 1)) }))} x={d => x(d.x)} y={d => y(d.y)} stroke={line.color} strokeWidth={2.8} />)}
          {showChargeSums && <>
            <LinePath data={carrierCurves.map(d => ({ x: d.x, y: Math.log10(Math.max(d.p + d.ionizedDonors, 1)) }))} x={d => x(d.x)} y={d => y(d.y)} stroke="#d97706" strokeWidth={2.5} strokeDasharray="7 4" />
            <LinePath data={carrierCurves.map(d => ({ x: d.x, y: Math.log10(Math.max(d.n + d.ionizedAcceptors, 1)) }))} x={d => x(d.x)} y={d => y(d.y)} stroke="#65a30d" strokeWidth={2.5} strokeDasharray="7 4" />
          </>}
          <line x1={x(0)} x2={x(E_G)} y1={y(Math.log10(Math.max(ni, 1)))} y2={y(Math.log10(Math.max(ni, 1)))} stroke={C.muted} strokeWidth={1.1} strokeDasharray="4 5" opacity={0.55} />
          <text x={x(E_G) - 5} y={y(Math.log10(Math.max(ni, 1))) - 7} textAnchor="end" className="plot-annotation" fill={C.muted}>nᵢ</text>
          <line x1={x(intrinsicLevel)} x2={x(intrinsicLevel)} y1={y(0)} y2={y(23)} stroke={C.muted} strokeWidth={1.1} strokeDasharray="4 5" opacity={0.55} />
          <line x1={x(fermiLevel)} x2={x(fermiLevel)} y1={y(0)} y2={y(23)} stroke={C.fermi} strokeWidth={2} strokeDasharray="6 3" opacity={0.9} />
          <text x={x(fermiLevel) + 6} y={y(22)} className="plot-annotation" fill={C.fermi}>E_F neutre</text>
          <line x1={x(donorLevel - kT * Math.log(2))} x2={x(donorLevel - kT * Math.log(2))} y1={y(0)} y2={y(23)} stroke={C.conduction} strokeWidth={1.1} strokeDasharray="4 4" opacity={0.8} />
          <text x={x(donorLevel - kT * Math.log(2)) - 5} y={y(21)} textAnchor="end" className="plot-annotation" fill={C.conduction}>E_D</text>
          <line x1={x(acceptorLevel + kT * Math.log(2))} x2={x(acceptorLevel + kT * Math.log(2))} y1={y(0)} y2={y(23)} stroke={C.purple} strokeWidth={1.1} strokeDasharray="4 4" opacity={0.8} />
          <text x={x(acceptorLevel + kT * Math.log(2)) + 5} y={y(21)} className="plot-annotation" fill={C.purple}>E_A</text>
          <circle cx={x(E_G)} cy={y(Math.log10(ncT))} r={4} fill={C.electron} stroke="white" strokeWidth={1.5} />
          <text x={x(E_G) - 7} y={y(Math.log10(ncT)) - 7} textAnchor="end" className="plot-annotation" fill={C.electron}>M_C(T)</text>
          <circle cx={x(0)} cy={y(Math.log10(nvT))} r={4} fill={C.hole} stroke="white" strokeWidth={1.5} />
          <text x={x(0) + 7} y={y(Math.log10(nvT)) - 7} className="plot-annotation" fill={C.hole}>M_V(T)</text>
        </>}
    </Plot>
    <div className="metric"><span>n</span><strong>{equilibrium.n.toExponential(2)} cm⁻³</strong><span>p</span><strong>{equilibrium.p.toExponential(2)} cm⁻³</strong><span>Nᴅ⁺</span><strong>{equilibrium.ionizedDonors.toExponential(2)} cm⁻³</strong><span>Nₐ⁻</span><strong>{equilibrium.ionizedAcceptors.toExponential(2)} cm⁻³</strong></div>
    <div className="insight"><strong>Balanç:</strong> n ({equilibrium.n.toExponential(2)}) + Nₐ⁻ ({equilibrium.ionizedAcceptors.toExponential(2)}) = p ({equilibrium.p.toExponential(2)}) + Nᴅ⁺ ({equilibrium.ionizedDonors.toExponential(2)}) cm⁻³.<br /><strong>Lectura d’E_F:</strong> {fermiPositionText}.<br /><strong>Per continuar analíticament:</strong> {fermiExplanation} {statisticsNote}</div>
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
