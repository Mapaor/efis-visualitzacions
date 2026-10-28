import { useState, type ReactNode } from 'react';
import { LinePath } from '@visx/shape';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Plot, Lines } from './Charts';
import { COLORS as C, E_G, K_B_EV, carrierDensities, diodeCurrent, format, intrinsicDensity, sample } from './physics';

function Range({ label, value, min, max, step, onChange, formatValue }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; formatValue: (value: number) => string }) {
  return <label className="range-control"><span>{label}</span><strong>{formatValue(value)}</strong><input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} /></label>;
}

function Card({ tag, title, children, className = '' }: { tag: string; title: string; children: ReactNode; className?: string }) {
  return <article className={`card ${className}`}><header className="card-heading"><div><span className="tag">{tag}</span><h3>{title}</h3></div></header>{children}</article>;
}

function Equation({ math }: { math: string }) {
  const html = katex.renderToString(math, { displayMode: true, throwOnError: false, output: 'htmlAndMathml' });
  return <div className="equation" dangerouslySetInnerHTML={{ __html: html }} />;
}

function PotentialAndOrbitals() {
  const [distance, setDistance] = useState(2.4);
  const xValues = sample(180, -3.2, 3.2);
  const potential = xValues.map(x => ({ x, y: Math.max(-2.45, -0.52 / Math.max(0.08, Math.abs(x - distance / 2)) - 0.52 / Math.max(0.08, Math.abs(x + distance / 2))) }));
  const atomicLevel = -1.72;
  const closePair = distance < 1.25;
  const bondingLevel = atomicLevel - 0.16 * Math.exp(-0.75 * (distance - 1));
  const antibondingLevel = atomicLevel + 0.16 * Math.exp(-0.75 * (distance - 1));
  return <>
    <div className="controls">
      <Range label="Separació entre àtoms" value={distance} min={1} max={4} step={0.05} onChange={setDistance} formatValue={v => `${format(v, 2)} unitats`} />
    </div>
    <div className="plot-stack">
      <Plot xDomain={[-3.2, 3.2]} yDomain={[-2.5, 0.35]} xLabel="Posició x · dos àtoms" yLabel="Energia potencial V(x)" xTicks={[-distance / 2, 0, distance / 2]} yTicks={[-2, -1, 0]}>
        {({ x, y }) => <>
          <line x1={x(-3.2)} x2={x(3.2)} y1={y(0)} y2={y(0)} stroke="#8793a2" strokeWidth={1.2} />
          <LinePath data={potential} x={d => x(d.x)} y={d => y(d.y)} stroke={C.ink} strokeWidth={3} />
          <line x1={x(-3.2)} x2={x(3.2)} y1={y(atomicLevel)} y2={y(atomicLevel)} stroke={C.valence} strokeWidth={1.8} strokeDasharray="6 4" />
          <circle cx={x(-distance / 2)} cy={y(0)} r={9} fill="#91a9c2" stroke="white" strokeWidth={2} />
          <circle cx={x(distance / 2)} cy={y(0)} r={9} fill="#91a9c2" stroke="white" strokeWidth={2} />
          <text x={x(-3.05)} y={y(atomicLevel) - 7} fill={C.valence} className="plot-annotation">Nivell atòmic</text>
          <text x={x(-distance / 2)} y={y(-2.34)} textAnchor="middle" className="plot-annotation">V → −∞</text>
          <text x={x(distance / 2)} y={y(-2.34)} textAnchor="middle" className="plot-annotation">V → −∞</text>
        </>}
      </Plot>
      <p className="plot-caption">Cada bola és un nucli atòmic. La línia negra és l’energia potencial de l’electró: cada nucli crea un pou. En acostar els àtoms, la barrera central baixa.</p>
      <Equation math="V(x)\to-\infty\quad\text{quan }x\to x_a\text{ o }x_b" />
      <Plot xDomain={[-3.2, 3.2]} yDomain={[-2.5, 0.35]} xLabel="Posició x · orbitals híbrids" yLabel="Energia potencial V(x)" xTicks={[-distance / 2, 0, distance / 2]} yTicks={[-2, -1, 0]}>
        {({ x, y }) => <>
          <LinePath data={potential} x={d => x(d.x)} y={d => y(d.y)} stroke="#a7b1bd" strokeWidth={2} />
          <line x1={x(-3.2)} x2={x(3.2)} y1={y(atomicLevel)} y2={y(atomicLevel)} stroke={C.muted} strokeDasharray="5 4" />
          <line x1={x(-2.65)} x2={x(2.65)} y1={y(bondingLevel)} y2={y(bondingLevel)} stroke={C.valence} strokeWidth={2.5} />
          <line x1={x(-2.65)} x2={x(2.65)} y1={y(antibondingLevel)} y2={y(antibondingLevel)} stroke={C.hole} strokeWidth={2.5} />
          <circle cx={x(-distance / 2)} cy={y(0)} r={8} fill="#91a9c2" stroke="white" strokeWidth={2} />
          <circle cx={x(distance / 2)} cy={y(0)} r={8} fill="#91a9c2" stroke="white" strokeWidth={2} />
          <text x={x(-3.05)} y={y(bondingLevel) + 16} fill={C.valence} className="plot-annotation">Enllaçant · energia més baixa</text>
          <text x={x(-3.05)} y={y(antibondingLevel) - 8} fill={C.hole} className="plot-annotation">Antienllaçant · energia més alta</text>
          {!closePair && <text x={x(0)} y={y(-0.52)} textAnchor="middle" className="plot-annotation">Apropem els àtoms per superar la barrera</text>}
        </>}
      </Plot>
      <p className="plot-caption">Quan la barrera queda per sota del nivell atòmic, aquest es divideix en dos: un estat enllaçant ocupat (verd) i un antienllaçant (vermell). {closePair ? 'Amb aquesta separació, la barrera ja és prou baixa.' : 'Redueix la separació amb el control.'}</p>
      <Equation math="E_{\text{enllaçant}}<E_{\text{atòmic}}<E_{\text{antienllaçant}}" />
    </div>
  </>;
}

function BandFormation() {
  const [atoms, setAtoms] = useState(12);
  const bandWidth = 0.48;
  const valence = Array.from({ length: atoms }, (_, i) => -bandWidth * (i + 0.5) / atoms);
  const conduction = Array.from({ length: atoms }, (_, i) => E_G + bandWidth * (i + 0.5) / atoms);
  return <>
    <Range label="Nombre d’àtoms" value={atoms} min={2} max={40} step={1} onChange={setAtoms} formatValue={v => `${v}`} />
    <Plot xDomain={[0, 1]} yDomain={[-0.85, 2]} xLabel={`${atoms} nivells per banda · amplada esquemàtica`} yLabel="Energia (eV)" xTicks={[]} yTicks={[0, E_G]} grid={false}>
      {({ x, y, width, height }) => <>
        <rect x={x(0.19)} y={y(0)} width={x(0.79) - x(0.19)} height={y(-bandWidth) - y(0)} fill={C.valence} opacity={0.12} />
        <rect x={x(0.19)} y={y(E_G + bandWidth)} width={x(0.79) - x(0.19)} height={y(E_G) - y(E_G + bandWidth)} fill={C.conduction} opacity={0.14} />
        {valence.map((energy, i) => <line key={`v${i}`} x1={x(0.27)} x2={x(0.72)} y1={y(energy)} y2={y(energy)} stroke={C.valence} strokeWidth={2.2} />)}
        {conduction.map((energy, i) => <line key={`c${i}`} x1={x(0.27)} x2={x(0.72)} y1={y(energy)} y2={y(energy)} stroke={C.conduction} strokeWidth={2.2} strokeDasharray="3 2" />)}
        <text x={x(0.49)} y={y(-bandWidth * 0.45)} textAnchor="middle" fill={C.valence} className="plot-annotation">VALÈNCIA · plena</text>
        <text x={x(0.49)} y={y(E_G + bandWidth * 0.55)} textAnchor="middle" fill={C.conduction} className="plot-annotation">CONDUCCIÓ · buida</text>
        <line x1={x(0.84)} x2={x(0.84)} y1={y(E_G)} y2={y(0)} stroke={C.ink} />
        <text x={x(0.87)} y={y(0.56)} className="plot-annotation">E<tspan baselineShift="sub">g</tspan> = 1,12 eV</text>
        <text x={width + 35} y={height + 35} className="plot-annotation">Les línies són nivells discrets</text>
      </>}
    </Plot>
    <p className="plot-caption">En un cristall, cada àtom aporta un nivell. En augmentar-ne el nombre, els nivells s’espesseixen fins a formar una banda. Amplada esquemàtica fixa.</p>
    <Equation math="N_{\text{àtoms}}\;\longrightarrow\;N_{\text{nivells}}\;\longrightarrow\;\text{banda}" />
  </>;
}

function EffectiveMass() {
  const [electronMass, setElectronMass] = useState(1);
  const [holeMass, setHoleMass] = useState(0.7);
  const k = sample(151, -1, 1);
  return <>
    <div className="controls two-controls">
      <Range label="Massa electrònica" value={electronMass} min={0.3} max={2.5} step={0.05} onChange={setElectronMass} formatValue={v => `${format(v)} m₀`} />
      <Range label="Massa de forat" value={holeMass} min={0.3} max={2.5} step={0.05} onChange={setHoleMass} formatValue={v => `${format(v)} m₀`} />
    </div>
    <Plot xDomain={[-1, 1]} yDomain={[-0.8, 2.2]} xLabel="Vector d’ona k (esquema)" yLabel="Energia E (eV)" xTicks={[-1, 0, 1]} yTicks={[0, E_G, 2]}>
      {({ x, y, width }) => <>
        <rect x={x(-1)} y={y(E_G)} width={width} height={y(0) - y(E_G)} fill={C.gap} />
        <LinePath data={k.map(value => ({ x: value, y: E_G + value ** 2 / (2 * electronMass) }))} x={d => x(d.x)} y={d => y(d.y)} stroke={C.conduction} strokeWidth={3} />
        <LinePath data={k.map(value => ({ x: value, y: -(value ** 2) / (2 * holeMass) }))} x={d => x(d.x)} y={d => y(d.y)} stroke={C.valence} strokeWidth={3} />
        <text x={x(0.53)} y={y(1.68)} fill={C.conduction} className="plot-annotation">Conducció</text>
        <text x={x(0.53)} y={y(-0.48)} fill={C.valence} className="plot-annotation">València</text>
        <text x={x(-0.9)} y={y(-0.68)} className="plot-annotation">Paràbola més ampla → massa més gran</text>
      </>}
    </Plot>
  </>;
}

function BandAndDos() {
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
      {({ x, y, width }) => <>
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

function IntrinsicCarriers() {
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
        <line x1={x(0)} x2={x(1)} y1={y(E_G)} y2={y(E_G)} stroke={C.ink} /><line x1={x(0)} x2={x(1)} y1={y(0)} y2={y(0)} stroke={C.ink} />
        {dots.map((dot, i) => <g key={i}><circle cx={x(dot.x)} cy={y(dot.e)} r={4} fill={C.electron} /><circle cx={x(1 - dot.x)} cy={y(dot.h)} r={4} fill="white" stroke={C.hole} strokeWidth={2} /></g>)}
        <text x={x(0.03)} y={y(1.5)} className="plot-annotation">Electrons</text><text x={x(0.03)} y={y(-0.34)} className="plot-annotation">Forats</text>
      </>}
    </Plot>
    <div className="metric"><span>Concentració intrínseca</span><strong>{intrinsicDensity(temperature).toExponential(2)} cm⁻³</strong><span>En material intrínsec: n = p = nᵢ</span></div>
  </>;
}

function TransportAndDiode() {
  const [logDonors, setLogDonors] = useState(16);
  const [temperature, setTemperature] = useState(300);
  const [logSaturation, setLogSaturation] = useState(-12);
  const donors = 10 ** logDonors;
  const temperatures = sample(140, 45, 900);
  const transport = temperatures.map(t => ({ t, ...carrierDensities(t, donors) }));
  const invT = transport.map(d => ({ x: 1000 / d.t, y: Math.log(d.electrons * 1.602e-19 * 1350 * (d.t / 300) ** -1.5) }));
  const carrierSeries = [
    { data: transport.map(d => ({ x: d.t, y: Math.log10(Math.max(d.electrons, 1)) })), color: C.electron },
    { data: transport.map(d => ({ x: d.t, y: Math.log10(Math.max(d.holes, 1)) })), color: C.hole },
    { data: transport.map(d => ({ x: d.t, y: Math.log10(Math.max(d.intrinsic, 1)) })), color: C.teal, dashed: true },
  ];
  const current = Math.pow(10, logSaturation);
  const voltage = sample(160, -1, 0.85);
  const forwardVoltage = sample(120, 0.01, 0.85);
  const diode = voltage.map(v => ({ x: v, y: diodeCurrent(v, temperature, current) }));
  const thermalVoltage = K_B_EV * temperature;
  const diodeForward = forwardVoltage.map(v => ({ x: v, current: diodeCurrent(v, temperature, current) }));
  const logMinimum = Math.floor(Math.log10(current * 0.1));
  const logMaximum = Math.ceil(Math.log10(Math.max(...diodeForward.map(d => d.current)) * 1.15));
  const logTickStep = Math.max(1, Math.ceil((logMaximum - logMinimum) / 5));
  const logTicks = Array.from({ length: Math.floor((logMaximum - logMinimum) / logTickStep) + 1 }, (_, i) => Math.ceil(logMinimum / logTickStep) * logTickStep + i * logTickStep).filter(tick => tick <= logMaximum);
  const logCurrent = diodeForward.map(d => ({ x: d.x, y: Math.log10(Math.max(d.current, current * 0.1)) }));
  const linearized = diodeForward.map(d => ({ x: d.x, y: Math.log1p(d.current / current) }));
  const linearizedMaximum = Math.ceil(Math.max(...linearized.map(d => d.y)) / 5) * 5;
  const linearizedTicks = Array.from({ length: linearizedMaximum / 10 + 1 }, (_, i) => i * 10);
  return <>
    <Card tag="SILICI TIPUS N" title="Règims de conducció · Shockley">
      <Range label="Dopatge donador Nᴅ" value={logDonors} min={14} max={18} step={0.1} onChange={setLogDonors} formatValue={() => `${donors.toExponential(1)} cm⁻³`} />
      <Plot xDomain={[1, 24]} yDomain={[Math.min(...invT.map(d => d.y)) - 1, Math.max(...invT.map(d => d.y)) + 1]} xLabel="1000/T (K⁻¹)" yLabel="ln σ (S/cm)" xTicks={[2, 5, 10, 20]}>
        {({ x, y }) => <LinePath data={invT} x={d => x(d.x)} y={d => y(d.y)} stroke={C.ink} strokeWidth={2.5} />}
      </Plot>
      <Plot xDomain={[40, 900]} yDomain={[0, 20]} xLabel="Temperatura (K)" yLabel="Concentració (cm⁻³, escala log)" xTicks={[100, 300, 500, 700, 900]} yTicks={[0, 5, 10, 15, 20]} yFormat={v => `10${format(v, 0)}`}>
        {({ x, y }) => <Lines series={carrierSeries} x={x} y={y} />}
      </Plot>
      <p className="insight">A baixa temperatura els dopants es congelen; a temperatura intermèdia dominen els donadors; a alta temperatura domina la generació intrínseca.</p>
    </Card>
    <Card tag="MODEL IDEAL · n = 1" title="Característica I(V) d’un díode">
      <div className="controls two-controls">
        <Range label="Temperatura" value={temperature} min={250} max={360} step={5} onChange={setTemperature} formatValue={v => `${v} K`} />
        <Range label="Corrent de saturació I₀" value={logSaturation} min={-14} max={-9} step={0.1} onChange={setLogSaturation} formatValue={v => `10${format(v, 1)} A`} />
      </div>
      <div className="grid two">
        <Plot xDomain={[-1, 0.85]} yDomain={[-current * 1.2, Math.max(0.02, Math.min(0.12, diodeCurrent(0.68, temperature, current) * 1.15))]} xLabel="Tensió V (V)" yLabel="Corrent I (A)" xTicks={[-1, -0.5, 0, 0.4, 0.8]}>
          {({ x, y }) => <LinePath data={diode} x={d => x(d.x)} y={d => y(d.y)} stroke={C.ink} strokeWidth={2.5} />}
        </Plot>
        <Plot xDomain={[0, 0.85]} yDomain={[logMinimum, logMaximum]} xLabel="Tensió directa V (V)" yLabel="Corrent |I| (A) · escala log₁₀" xTicks={[0, 0.2, 0.4, 0.6, 0.8]} yTicks={logTicks} yFormat={v => `10${format(v, 0)}`}>
          {({ x, y }) => <LinePath data={logCurrent} x={d => x(d.x)} y={d => y(d.y)} stroke={C.conduction} strokeWidth={2.5} />}
        </Plot>
      </div>
      <Plot xDomain={[0, 0.85]} yDomain={[0, linearizedMaximum]} xLabel="Tensió directa V (V)" yLabel="ln(1 + I/I₀)" xTicks={[0, 0.2, 0.4, 0.6, 0.8]} yTicks={linearizedTicks}>
        {({ x, y }) => <LinePath data={linearized} x={d => x(d.x)} y={d => y(d.y)} stroke={C.valence} strokeWidth={2.5} />}
      </Plot>
      <p className="plot-caption">En escala semilogarítmica, el corrent directe s’aproxima a una recta. La transformació de sota és una recta exacta en aquest model; la pendent disminueix quan augmenta la temperatura.</p>
      <Equation math="I=I_0\left(e^{V/V_T}-1\right),\qquad V_T=\frac{k_BT}{q}" />
      <Equation math="\ln\left(1+\frac{I}{I_0}\right)=\frac{V}{V_T}" />
      <div className="metric"><span>Voltatge tèrmic V<sub>T</sub></span><strong>{(thermalVoltage * 1000).toFixed(1)} mV</strong></div>
    </Card>
  </>;
}

export default function App() {
  return <>
    <nav className="section-nav" aria-label="Seccions"><a href="#bandes">Estructura electrònica</a><a href="#portadors">Portadors</a><a href="#transport">Transport</a></nav>
    <main id="top">
      <section className="chapter" id="bandes"><div className="chapter-head"><div><div className="eyebrow">01 / ESTRUCTURA ELECTRÒNICA</div><h2>De l’àtom al cristall</h2></div><p>Quan els àtoms s’apropen, els nivells es divideixen. En un cristall, molts nivells pròxims formen bandes.</p></div>
        <div className="grid two"><Card tag="MODEL QUALITATIU · SILICI" title="Potencial i orbitals híbrids"><PotentialAndOrbitals /></Card><Card tag="MOLTS ÀTOMS · NIVELLS DISCRETS" title="Formació de bandes"><BandFormation /></Card></div>
        <div className="grid two lower-grid"><Card tag="MASSA EFECTIVA" title="Dispersió d’energia E(k)"><EffectiveMass /></Card><Card tag="SILICI · 300 K" title="Bandes i densitat d’estats"><BandAndDos /></Card></div>
      </section>
      <section className="chapter" id="portadors"><div className="chapter-head"><div><div className="eyebrow">02 / ESTADÍSTICA DE PORTADORS</div><h2>Portadors en equilibri</h2></div><p>La temperatura genera parelles electró-forat i modifica la concentració intrínseca.</p></div><div className="grid single"><Card tag="SEMICONDUCTOR INTRÍNSEC" title="Generació tèrmica de parelles"><IntrinsicCarriers /></Card></div></section>
      <section className="chapter" id="transport"><div className="chapter-head"><div><div className="eyebrow">03 / TEMPERATURA I TRANSPORT</div><h2>De la concentració al corrent</h2></div><p>Explora els règims tèrmics d’un semiconductor dopat i la resposta d’un díode ideal.</p></div><div className="grid two"><TransportAndDiode /></div></section>
      <footer><span>Models esquemàtics amb finalitat docent · Silici</span><a href="#top">Torna a dalt ↑</a></footer>
    </main>
  </>;
}
