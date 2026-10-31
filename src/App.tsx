import { useEffect } from 'react';
import { Card } from './components/Card';
import { DopedStatistics, ExtrinsicDos, FermiDistribution, FermiTemperatureShift, ShockleyRegimes, ThermalDos, ThermalStatisticsPanels } from './visualizations/Tema2';
import { BandFormation, EffectiveMass, PotentialAndOrbitals } from './visualizations/Tema1';
import { DriftVelocity, TransportEquilibrium } from './visualizations/Tema3';
import { MinorityCarriers } from './visualizations/Tema4';
import { DiodeCharacteristic, SchottkyCharacteristic } from './visualizations/Tema5';

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const standaloneArrhenius = path === '/arrhenius';
  const standaloneShockley = path === '/shockley';
  useEffect(() => {
    document.title = standaloneArrhenius
      ? 'Diagrama d’Arrhenius · Física Electrònica'
      : standaloneShockley
        ? 'Neutralitat de Shockley · Física Electrònica'
        : 'Física Electrònica · Laboratori visual';
  }, [standaloneArrhenius, standaloneShockley]);

  if (standaloneArrhenius || standaloneShockley) {
    return <main className="standalone-page">
      <div className="standalone-header"><a href="/">← Totes les visualitzacions</a><span>Visualització ampliada · Tema 2</span></div>
      {standaloneArrhenius
        ? <ShockleyRegimes />
        : <Card tag="NEUTRALITAT ELÈCTRICA · PORTADORS I DOPANTS IONITZATS" title="Diagrama de Shockley: concentracions en funció d’E_F"><DopedStatistics /></Card>}
    </main>;
  }

  return <>
    <nav className="section-nav" aria-label="Temes">
      <a href="#tema1">Tema 1 · Bandes</a>
      <a href="#tema2">Tema 2 · Estadística</a>
      <a href="#tema3">Tema 3 · Transport</a>
      <a href="#tema4">Tema 4 · Equacions</a>
      <a href="#tema5">Tema 5 · Díodes</a>
    </nav>
    <main id="top">
      <section className="chapter" id="tema1">
        <div className="chapter-head">
          <div><div className="eyebrow">TEMA 1 · INTRODUCCIÓ ALS SEMICONDUCTORS</div><h2>De l’àtom al cristall</h2></div>
          <p>De l’estructura de bandes i la massa efectiva al moviment semiclàssic dels electrons.</p>
        </div>
        <div className="grid two">
          <Card tag="MODEL QUALITATIU · SILICI" title="Potencial i orbitals híbrids"><PotentialAndOrbitals /></Card>
          <Card tag="MOLTS ÀTOMS · NIVELLS DISCRETS" title="Formació de bandes"><BandFormation /></Card>
        </div>
        <div className="grid single lower-grid">
          <Card tag="MASSA EFECTIVA · MOVIMENT SEMICLÀSSIC" title="Dispersió E(k), velocitat de grup i força"><EffectiveMass /></Card>
        </div>
      </section>

      <section className="chapter" id="tema2">
        <div className="chapter-head">
          <div><div className="eyebrow">TEMA 2 · ESTADÍSTICA DE PORTADORS</div><h2>Ocupació, dopatge i concentració</h2></div>
          <p>Com la temperatura i les impureses determinen el nivell de Fermi i les concentracions d’electrons i forats.</p>
        </div>
        <div className="chapter-links"><a href="/arrhenius">Arrhenius en gran ↗</a><a href="/shockley">Neutralitat de Shockley en gran ↗</a></div>
        <div className="grid single">
          <ShockleyRegimes />
          <Card tag="NEUTRALITAT ELÈCTRICA · PORTADORS I DOPANTS IONITZATS" title="Diagrama de Shockley: concentracions en funció d’E_F"><DopedStatistics /></Card>
        </div>
        <ThermalStatisticsPanels />
        <div className="grid single lower-grid"><FermiDistribution /></div>
        <div className="grid single lower-grid"><ThermalDos /></div>
        <div className="grid single lower-grid"><ExtrinsicDos /></div>
        <div className="grid single lower-grid"><FermiTemperatureShift /></div>
      </section>

      <section className="chapter" id="tema3">
        <div className="chapter-head">
          <div><div className="eyebrow">TEMA 3 · TRANSPORT EN EQUILIBRI</div><h2>Deriva, difusió i camp elèctric</h2></div>
          <p>El camp inclina les bandes; els gradients de concentració impulsen la difusió. El corrent total suma les dues contribucions.</p>
        </div>
        <div className="grid single">
          <Card tag="RELACIÓ D’EINSTEIN" title="Com competeixen deriva i difusió"><TransportEquilibrium /></Card>
          <Card tag="VELOCITAT DE DERIVA · SATURACIÓ" title="Velocitat de deriva en funció del camp elèctric"><DriftVelocity /></Card>
        </div>
      </section>

      <section className="chapter" id="tema4">
        <div className="chapter-head">
          <div><div className="eyebrow">TEMA 4 · EQUACIONS DELS SEMICONDUCTORS</div><h2>Injecció, difusió i recombinació</h2></div>
          <p>Segueix els portadors minoritaris des del contacte, al llarg del material i durant la seva recombinació.</p>
        </div>
        <div className="grid single">
          <Card tag="PORTADORS MINORITARIS · 1D" title="Longitud de difusió i temps de vida"><MinorityCarriers /></Card>
        </div>
      </section>

      <section className="chapter" id="tema5">
        <div className="chapter-head">
          <div><div className="eyebrow">TEMA 5 · DÍODES</div><h2>Díodes de Shockley i Schottky</h2></div>
          <p>Comparació del model de junció p-n amb el contacte metall-semiconductor i l’emissió termoiónica.</p>
        </div>
        <div className="grid two"><DiodeCharacteristic /><SchottkyCharacteristic /></div>
      </section>

      <footer><span>Models esquemàtics amb finalitat docent · Silici</span><a href="#top">Torna a dalt ↑</a></footer>
    </main>
  </>;
}
