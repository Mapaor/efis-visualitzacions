import { useState } from 'react';
import { LinePath } from '@visx/shape';
import { Plot } from '../Charts';
import { Equation } from '../components/Equation';
import { Range } from '../components/Range';
import { COLORS as C, E_G, format, sample } from '../physics';

export function PotentialAndOrbitals() {
  const [distance, setDistance] = useState(2.4);
  const xValues = sample(180, -3.2, 3.2);
  const potential = xValues.map(x => ({ x, y: Math.max(-2.45, -0.52 / Math.max(0.08, Math.abs(x - distance / 2)) - 0.52 / Math.max(0.08, Math.abs(x + distance / 2))) }));
  const atomicLevel = -1.72;
  const closePair = distance < 1.25;
  const bondingLevel = atomicLevel - 0.16 * Math.exp(-0.75 * (distance - 1));
  const antibondingLevel = atomicLevel + 0.16 * Math.exp(-0.75 * (distance - 1));
  return <>
    <div className="controls"><Range label="Separació entre àtoms" value={distance} min={1} max={4} step={0.05} onChange={setDistance} formatValue={v => `${format(v, 2)} unitats`} /></div>
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

export function BandFormation() {
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

export function EffectiveMass() {
  const [electronMass, setElectronMass] = useState(1);
  const [holeMass, setHoleMass] = useState(0.7);
  const [initialK, setInitialK] = useState(-0.4);
  const [force, setForce] = useState(0.3);
  const [time, setTime] = useState(1);
  const currentK = Math.max(-1, Math.min(1, initialK + force * time));
  const conductionEnergy = (value: number) => E_G + value ** 2 / (2 * electronMass);
  const groupVelocity = currentK / electronMass;
  const k = sample(151, -1, 1);
  return <>
    <div className="controls three-controls">
      <Range label="Massa electrònica" value={electronMass} min={0.3} max={2.5} step={0.05} onChange={setElectronMass} formatValue={v => `${format(v)} m₀`} />
      <Range label="Massa de forat" value={holeMass} min={0.3} max={2.5} step={0.05} onChange={setHoleMass} formatValue={v => `${format(v)} m₀`} />
      <Range label="Vector d’ona inicial k₀" value={initialK} min={-0.8} max={0.8} step={0.05} onChange={setInitialK} formatValue={v => `${format(v)} (relatiu)`} />
      <Range label="Força aplicada F" value={force} min={-0.6} max={0.6} step={0.05} onChange={setForce} formatValue={v => `${format(v)} (relativa)`} />
      <Range label="Temps t" value={time} min={0} max={2} step={0.05} onChange={setTime} formatValue={v => `${format(v)} (relatiu)`} />
    </div>
    <Plot xDomain={[-1, 1]} yDomain={[-0.8, 2.2]} xLabel="Vector d’ona k (esquema)" yLabel="Energia E (eV)" xTicks={[-1, 0, 1]} yTicks={[0, E_G, 2]}>
      {({ x, y, width }) => <>
        <rect x={x(-1)} y={y(E_G)} width={width} height={y(0) - y(E_G)} fill={C.gap} />
        <LinePath data={k.map(value => ({ x: value, y: E_G + value ** 2 / (2 * electronMass) }))} x={d => x(d.x)} y={d => y(d.y)} stroke={C.conduction} strokeWidth={3} />
        <LinePath data={k.map(value => ({ x: value, y: -(value ** 2) / (2 * holeMass) }))} x={d => x(d.x)} y={d => y(d.y)} stroke={C.valence} strokeWidth={3} />
        <LinePath data={[{ x: currentK - 0.18, y: conductionEnergy(currentK - 0.18) }, { x: currentK + 0.18, y: conductionEnergy(currentK + 0.18) }]} x={d => x(d.x)} y={d => y(d.y)} stroke={C.ink} strokeWidth={1.5} strokeDasharray="4 3" />
        <circle cx={x(currentK)} cy={y(conductionEnergy(currentK))} r={5} fill={C.ink} stroke="white" strokeWidth={2} />
        <text x={x(0.53)} y={y(1.68)} fill={C.conduction} className="plot-annotation">Conducció</text>
        <text x={x(0.53)} y={y(-0.48)} fill={C.valence} className="plot-annotation">València</text>
        <text x={x(-0.9)} y={y(-0.68)} className="plot-annotation">Paràbola més ampla → massa més gran</text>
      </>}
    </Plot>
    <Equation math="\hbar\frac{dk}{dt}=F,\qquad v_g=\frac{1}{\hbar}\frac{dE}{dk}" />
    <p className="plot-caption">El punt i la tangent mostren l’estat actual. Els controls de k, F i t són normalitzats, amb ℏ = 1 en l’actualització k(t) = k₀ + Ft.</p>
    <div className="metric"><span>k(t) · model normalitzat</span><strong>{format(currentK, 2)}</strong><span>Velocitat de grup v<sub>g</sub> · relativa</span><strong>{format(groupVelocity, 2)}</strong></div>
  </>;
}
