import React, { useState } from 'react';

const SAMPLE_EANS = [
  { label: 'Coca-Cola 1.5L', code: '5449000000996' },
  { label: 'Monster Energy', code: '5060337500924' },
  { label: 'Nutella 750g', code: '3017620422003' },
  { label: 'Evian 1.5L', code: '3068320053506' }
];

export default function ScannerDevTool(props) {
  const { onSimulate, onSimulateFive, onForceManual, scanning, onToggleScanning } = props;
  const [code, setCode] = useState('');

  const selectSample = (c) => setCode(c);

  return (
    <div className="dev-tool">
      <div className="dev-tool-header">🧪 Outil de test (dev-only)</div>

      <div className="dev-tool-row">
        <input
          className="dev-tool-input"
          type="text"
          placeholder="EAN (ex: 5449000000996)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="dev-tool-btn" onClick={() => onSimulate?.(code)} disabled={!code}>
          Simuler détection
        </button>
        <button className="dev-tool-btn" onClick={() => onSimulateFive?.(code)} disabled={!code}>
          Simuler 5 échecs
        </button>
        <button className="dev-tool-btn" onClick={() => onForceManual?.(code)} disabled={!code}>
          Forcer saisie manuelle
        </button>
      </div>

      <div className="dev-tool-row">
        <span className="dev-tool-note">Exemples:</span>
        {SAMPLE_EANS.map(s => (
          <button
            key={s.code}
            className="dev-tool-chip"
            onClick={() => selectSample(s.code)}
            title={s.label}
          >
            {s.label}
          </button>
        ))}
        {code && (
          <a className="dev-tool-link" href={`https://world.openfoodfacts.org/api/v2/product/${code}.json`} target="_blank" rel="noreferrer">
            Voir OFF
          </a>
        )}
      </div>

      <div className="dev-tool-row">
        <button className="dev-tool-toggle" onClick={() => onToggleScanning?.(!scanning)}>
          {scanning ? '⏹️ Stopper le scan' : '📷 Démarrer le scan'}
        </button>
      </div>
    </div>
  );
}