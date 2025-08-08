import React, { useState, useRef, useEffect, useContext, useCallback } from "react";
import Quagga from "@ericblade/quagga2";
import { StockContext } from './StockContext';
import './CSS/ScannerStockApp.css';
import { normalizeOFFProduct, normalizeFreeTextName } from './utils/normalizeProductName';
import ScannerDevTool from './components/ScannerDevTool';

export default function ScannerStockApp() {
  const ignoredCodesRef = useRef(new Set());
  const codeAttemptsRef = useRef({});

  const scanAttemptsRef = useRef(0);
  const lastDetectedCodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef(null);
  const quaggaStartedRef = useRef(false);
  const { addToStock } = useContext(StockContext);

  // +++ Handlers stables via refs
  const onDetectedRef = useRef(null);
  const detectedHandlerRef = useRef(null);
  const processedHandlerRef = useRef(null);

  const DEV = process.env.NODE_ENV !== 'production';

  // Helper: récupère le nom canonique OFF
  async function fetchOFFCanonicalName(ean) {
    const resp = await fetch(`https://world.openfoodfacts.org/api/v2/product/${ean}.json`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const off = data?.product;
    if (!off) return null;
    const normalized = normalizeOFFProduct(off);
    return normalized.canonicalName || null;
  }

  const onDetected = useCallback(async (result) => {
    if (!result || !result.codeResult) return;
    const code = result.codeResult.code;
    if (!code || isLoading || pendingProduct || ignoredCodesRef.current.has(code)) return;

    codeAttemptsRef.current[code] = (codeAttemptsRef.current[code] || 0) + 1;

    setIsLoading(true);

    const productName = await fetchOFFCanonicalName(code);

    if (productName) {
      setPendingProduct({ code, nom: productName, found: true });
    } else if (codeAttemptsRef.current[code] >= 15) {
      ignoredCodesRef.current.add(code);
      console.warn(`Code ${code} ignoré après 15 échecs`);
    } else if (codeAttemptsRef.current[code] >= 5) {
      setPendingProduct({ code, nom: "", found: false });
    }

    setIsLoading(false);
  }, [isLoading, pendingProduct]);

  // +++ garder la dernière version de onDetected sans relancer Quagga
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  const confirmAdd = () => {
    if (pendingProduct.nom.trim()) {
      addToStock({
        code: pendingProduct.code,
        nom: normalizeFreeTextName(pendingProduct.nom.trim())
      });
    }
    resetScannerState();
  };

  const cancelAdd = () => {
    resetScannerState();
  };

  const resetScannerState = () => {
    if (pendingProduct?.code) {
      ignoredCodesRef.current.add(pendingProduct.code);
    }
    setPendingProduct(null);
    lastDetectedCodeRef.current = null;
    scanAttemptsRef.current = 0;
  };

  const onNomChange = (e) => {
    setPendingProduct((prev) => ({ ...prev, nom: e.target.value }));
  };

  useEffect(() => {
    // Déclaré hors du if(scanning) pour être visible dans toutes les branches
    const onProcessed = (result) => {
      const ctx = Quagga.canvas?.ctx?.overlay;
      const canvas = Quagga.canvas?.dom?.overlay;
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!result) return;
      if (result.boxes) {
        result.boxes
          .filter((b) => b !== result.box)
          .forEach((b) =>
            Quagga.ImageDebug.drawPath(b, { x: 0, y: 1 }, ctx, { color: "green", lineWidth: 2 })
          );
      }
      if (result.box) {
        Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, ctx, { color: "#00ff88", lineWidth: 3 });
      }
      if (result.codeResult && result.line) {
        Quagga.ImageDebug.drawPath(result.line, { x: "x", y: "y" }, ctx, { color: "red", lineWidth: 3 });
      }
    };

    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (scanning) {
      if (!scannerRef.current) return;

      const config = {
        inputStream: {
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            ...(isMobile ? { facingMode: { ideal: "environment" } } : {}),
            width: { ideal: isMobile ? 1920 : 1280 },
            height: { ideal: isMobile ? 1080 : 720 }
          },
        },
        locator: { patchSize: "large", halfSample: true },
        numOfWorkers: Math.max(2, (navigator.hardwareConcurrency || 4) - 1),
        frequency: 15,
        decoder: { readers: ["ean_reader", "ean_8_reader", "upc_reader"] },
        locate: true
      };

      Quagga.init(config, (err) => {
        if (err) {
          console.error("Quagga init error:", err);
          // Ne PAS forcer setScanning(false) ici pour éviter de fermer l’UI en cas d’échec transitoire
          return;
        }
        Quagga.start();
        quaggaStartedRef.current = true;

        // Enregistrer des wrappers stables pour pouvoir les retirer
        detectedHandlerRef.current = (res) => onDetectedRef.current && onDetectedRef.current(res);
        processedHandlerRef.current = onProcessed;

        Quagga.onDetected(detectedHandlerRef.current);
        Quagga.onProcessed(processedHandlerRef.current);
      });
    } else {
      if (quaggaStartedRef.current) {
        if (detectedHandlerRef.current) Quagga.offDetected(detectedHandlerRef.current);
        if (Quagga.offProcessed && processedHandlerRef.current) {
          Quagga.offProcessed(processedHandlerRef.current);
        }
        Quagga.stop();
        quaggaStartedRef.current = false;
        detectedHandlerRef.current = null;
        processedHandlerRef.current = null;
      }
    }

    return () => {
      if (quaggaStartedRef.current) {
        if (detectedHandlerRef.current) Quagga.offDetected(detectedHandlerRef.current);
        if (Quagga.offProcessed && processedHandlerRef.current) {
          Quagga.offProcessed(processedHandlerRef.current);
        }
        Quagga.stop();
        quaggaStartedRef.current = false;
        detectedHandlerRef.current = null;
        processedHandlerRef.current = null;
      }
    };
  }, [scanning]); // <<< dépend uniquement de scanning (pas de onDetected)

  // Pause/reprise de la détection sans arrêter la caméra
  useEffect(() => {
    if (!quaggaStartedRef.current) return;

    if (pendingProduct) {
      if (detectedHandlerRef.current) Quagga.offDetected(detectedHandlerRef.current);
    } else {
      if (quaggaStartedRef.current && detectedHandlerRef.current) {
        Quagga.onDetected(detectedHandlerRef.current);
      }
    }
  }, [pendingProduct]);


  const isDetectionActive = scanning && !pendingProduct && !isLoading;

  // Helpers dev: simulation de détection
  const simulateDetected = useCallback((code) => {
    if (!code) return;
    const str = String(code).trim();
    if (!str) return;
    if (!scanning) setScanning(true);
    onDetectedRef.current && onDetectedRef.current({ codeResult: { code: str } });
  }, [scanning]);

  const simulateFiveFailures = useCallback(async (code) => {
    const str = String(code || '').trim() || '0000000000000_MANUAL';
    if (!scanning) setScanning(true);
    for (let i = 0; i < 5; i++) {
      onDetectedRef.current && onDetectedRef.current({ codeResult: { code: str } });
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 150));
    }
  }, [scanning]);

  const forceManual = useCallback((code) => {
    const str = String(code || '').trim() || '0000000000000_MANUAL';
    if (!scanning) setScanning(true);
    setPendingProduct({ code: str, nom: '', found: false });
  }, [scanning]);

  return (
    <div className="scanner-container">
      <div className="scanner-card">
        <h1 className="scanner-title">📱 Scanner et gestion du stock</h1>

        <button
          onClick={() => setScanning(!scanning)}
          className={`scan-button ${scanning ? 'scanning' : ''}`}
        >
          {scanning ? "⏹️ Stopper le scan" : "📷 Démarrer le scan"}
        </button>

        {scanning && (
          <div className="scanner-viewport">
            <div ref={scannerRef} className="scanner-area" />
            <div className="scanner-overlay">
              <div className={`scanner-frame ${!isDetectionActive ? 'inactive' : ''}`}></div>
              <p className="scanner-instructions">
                {isLoading
                  ? "🔍 Recherche du produit..."
                  : pendingProduct
                    ? pendingProduct.found
                      ? "✅ Produit trouvé !"
                      : "📝 Produit non trouvé après 5 essais"
                    : "Positionnez le code-barres dans le cadre"}
              </p>
            </div>
          </div>
        )}

        {pendingProduct && (
          <div className={`product-confirmation ${pendingProduct.found ? "success" : "error"}`}>
            <h3>{pendingProduct.found ? "✅ Produit détecté !" : "❌ Produit non trouvé"}</h3>
            <p><strong>Code:</strong> {pendingProduct.code}</p>
            <p>{pendingProduct.found ? "Confirmer l'ajout du produit :" : "Entrez manuellement le nom du produit :"}</p>
            <input
              type="text"
              value={pendingProduct.nom}
              onChange={onNomChange}
              className="product-input"
              placeholder="Nom du produit"
            />
            <div className="confirmation-buttons">
              <button onClick={confirmAdd} className="btn-confirm">✓ Confirmer</button>
              <button onClick={cancelAdd} className="btn-cancel">✗ Annuler</button>
            </div>
          </div>
        )}

        {DEV && (
          <ScannerDevTool
            onSimulate={simulateDetected}
            onSimulateFive={simulateFiveFailures}
            onForceManual={forceManual}
            scanning={scanning}
            onToggleScanning={setScanning}
          />
        )}
      </div>
    </div>
  );
}
