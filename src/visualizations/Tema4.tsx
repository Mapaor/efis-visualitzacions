import { useState } from 'react';
import { LinePath } from '@visx/shape';
import { Plot } from '../Charts';
import { Equation } from '../components/Equation';
import { Range } from '../components/Range';
import { COLORS as C, format, intrinsicDensity, sample } from '../physics';

export function MinorityCarriers() {
  const [logDonors, setLogDonors] = useState(16);
  const [logInjection, setLogInjection] = useState(13);
  const [diffusion, setDiffusion] = useState(10);
  const [lifetime, setLifetime] = useState(2);
  const [elapsed, setElapsed] = useState(1);
  const donors = 10 ** logDonors;
  const excessAtBoundary = 10 ** logInjection;
  const equilibriumMinority = intrinsicDensity(300) ** 2 / donors;
  const diffusionLength = 10 * Math.sqrt(diffusion * lifetime);
  const lowInjection = excessAtBoundary / donors < 0.1;
  const distanceProfile = sample(120, 0, 5 * diffusionLength).map(position => ({ x: position, y: Math.exp(-position / diffusionLength) }));
  const timeProfile = sample(100, 0, 5).map(timeOverLifetime => ({ x: timeOverLifetime, y: Math.exp(-timeOverLifetime) }));
  return <>
    <div className="controls three-controls">
      <Range label="Dopatge donador Nᴅ" value={logDonors} min={14} max={18} step={0.1} onChange={setLogDonors} formatValue={() => `${donors.toExponential(1)} cm⁻³`} />
      <Range label="Excés injectat Δp(0)" value={logInjection} min={10} max={18} step={0.1} onChange={setLogInjection} formatValue={() => `${excessAtBoundary.toExponential(1)} cm⁻³`} />
      <Range label="Coeficient de difusió Dₚ" value={diffusion} min={1} max={35} step={0.5} onChange={setDiffusion} formatValue={v => `${format(v, 1)} cm²/s`} />
      <Range label="Temps de vida τₚ" value={lifetime} min={0.1} max={10} step={0.1} onChange={setLifetime} formatValue={v => `${format(v, 1)} μs`} />
      <Range label="Temps transcorregut t/τₚ" value={elapsed} min={0} max={5} step={0.1} onChange={setElapsed} formatValue={v => `${format(v, 1)} τₚ`} />
    </div>
    <div className="plot-pair">
      <Plot xDomain={[0, 5 * diffusionLength]} yDomain={[0, 1.05]} xLabel="Distància des del contacte (μm)" yLabel="Excés de forats Δp/Δp(0)" xTicks={[0, diffusionLength, 3 * diffusionLength, 5 * diffusionLength]} xFormat={v => format(v, 0)} yTicks={[0, 0.5, 1]}>
        {({ x, y }) => <LinePath data={distanceProfile} x={d => x(d.x)} y={d => y(d.y)} stroke={C.hole} strokeWidth={3} />}
      </Plot>
      <Plot xDomain={[0, 5]} yDomain={[0, 1.05]} xLabel="Temps després d’apagar la font (t/τₚ)" yLabel="Excés local Δp/Δp(0)" xTicks={[0, 1, 2, 3, 4, 5]} yTicks={[0, 0.5, 1]}>
        {({ x, y }) => <>
          <LinePath data={timeProfile} x={d => x(d.x)} y={d => y(d.y)} stroke={C.conduction} strokeWidth={3} />
          <circle cx={x(elapsed)} cy={y(Math.exp(-elapsed))} r={5} fill={C.ink} stroke="white" strokeWidth={2} />
        </>}
      </Plot>
    </div>
    <div className="metric"><span>Longitud de difusió Lₚ</span><strong>{format(diffusionLength, 1)} μm</strong><span>Forats minoritaris d’equilibri p₀</span><strong>{equilibriumMinority.toExponential(2)} cm⁻³</strong><span>Règim d’injecció</span><strong>{lowInjection ? 'Baix nivell' : 'Alt nivell'}</strong></div>
    <p className="plot-caption">La primera corba és el perfil estacionari amb Δp(0) fix al contacte. La segona és el decaïment local sense flux de difusió després d’apagar la font. Baix nivell: Δp ≪ Nᴅ; en quasineutralitat, Δn ≈ Δp.</p>
    <Equation math="\frac{\partial\Delta p}{\partial t}=D_p\frac{\partial^2\Delta p}{\partial x^2}-\frac{\Delta p}{\tau_p}+G" />
    <Equation math="L_p=\sqrt{D_p\tau_p},\qquad \Delta p(x)=\Delta p(0)e^{-x/L_p},\qquad \Delta p(0)=\Delta p_0,\;\Delta p(\infty)=0" />
    <Equation math="\Delta p\ll n_0\simeq N_D,\qquad \Delta n\simeq\Delta p" />
  </>;
}
