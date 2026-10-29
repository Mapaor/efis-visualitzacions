import { useState } from 'react';
import { LinePath } from '@visx/shape';
import { Plot } from '../Charts';
import { Card } from '../components/Card';
import { Equation } from '../components/Equation';
import { Range } from '../components/Range';
import { COLORS as C, K_B_EV, diodeCurrent, format, sample } from '../physics';

export function DiodeCharacteristic() {
  const [temperature, setTemperature] = useState(300);
  const [logSaturation, setLogSaturation] = useState(-12);
  const current = 10 ** logSaturation;
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
  return <Card tag="MODEL IDEAL · n = 1" title="Característica I(V) d’un díode">
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
  </Card>;
}

export function SchottkyCharacteristic() {
  const [temperature, setTemperature] = useState(300);
  const [barrier, setBarrier] = useState(0.78);
  const [logArea, setLogArea] = useState(-4);
  const area = 10 ** logArea;
  const vt = K_B_EV * temperature;
  const saturation = 112 * area * temperature ** 2 * Math.exp(-barrier / vt);
  const voltage = sample(160, -0.5, 0.8);
  const currentAt = (v: number) => saturation * (Math.exp(Math.min(v / (1.08 * vt), 40)) - 1);
  const curve = voltage.map(v => ({ x: v, y: currentAt(v) }));
  const forward = sample(120, 0.01, 0.8).map(v => ({ x: v, y: Math.log10(Math.max(currentAt(v), saturation * 0.1)) }));
  const min = Math.floor(Math.log10(saturation * 0.1));
  const max = Math.ceil(Math.log10(Math.max(...forward.map(d => 10 ** d.y)) * 1.15));
  const ticks = Array.from({ length: Math.min(6, max - min + 1) }, (_, i) => min + i * Math.max(1, Math.ceil((max - min) / 5)));
  return <Card tag="CONTACTE METALL-SEMICONDUCTOR · EMISSIÓ TERMOIÒNICA" title="Característica I(V) d’un díode Schottky">
    <div className="controls three-controls">
      <Range label="Temperatura" value={temperature} min={250} max={400} step={5} onChange={setTemperature} formatValue={v => `${v} K`} />
      <Range label="Alçada de barrera Φ_B" value={barrier} min={0.65} max={0.95} step={0.01} onChange={setBarrier} formatValue={v => `${format(v, 2)} eV`} />
      <Range label="Àrea de contacte" value={logArea} min={-6} max={-2} step={0.1} onChange={setLogArea} formatValue={() => `${area.toExponential(1)} cm²`} />
    </div>
    <div className="grid two">
      <Plot xDomain={[-0.5, 0.8]} yDomain={[-saturation * 1.2, Math.max(0.02, currentAt(0.62) * 1.15)]} xLabel="Tensió V (V)" yLabel="Corrent I (A)" xTicks={[-0.4, 0, 0.4, 0.8]}>
        {({ x, y }) => <LinePath data={curve} x={d => x(d.x)} y={d => y(d.y)} stroke={C.ink} strokeWidth={2.5} />}
      </Plot>
      <Plot xDomain={[0, 0.8]} yDomain={[min, max]} xLabel="Tensió directa V (V)" yLabel="Corrent I (A) · escala log₁₀" xTicks={[0, 0.2, 0.4, 0.6, 0.8]} yTicks={ticks} yFormat={v => `10${format(v, 0)}`}>
        {({ x, y }) => <LinePath data={forward} x={d => x(d.x)} y={d => y(d.y)} stroke={C.conduction} strokeWidth={2.5} />}
      </Plot>
    </div>
    <Equation math="I=I_S\left(e^{V/(nV_T)}-1\right),\qquad I_S=A A^*T^2e^{-\Phi_B/V_T}" />
    <div className="metric"><span>Factor d’idealisme n</span><strong>1,08</strong><span>Corrent de saturació I<sub>S</sub></span><strong>{saturation.toExponential(2)} A</strong><span>Model ideal de difusió termoiónica</span></div>
  </Card>;
}
