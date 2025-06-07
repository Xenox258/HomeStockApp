import React, { useState, useRef, useEffect, useContext, useCallback } from "react";
import Quagga from "@ericblade/quagga2";
import { StockContext } from './StockContext';
import './CSS/ScannerStockApp.css';

export default function ScannerStockApp() {
  const scanAttemptsRef = useRef(0);
  const lastDetectedCodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef(null);
  const quaggaStartedRef = useRef(false);
  const { addToStock } = useContext(StockContext);

  async function fetchProductName(code) {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status === 1 && data.product && data.product.product_name) {
        return data.product.product_name;
      }
      return null;
    } catch {
      return null;
    }
  }

  const onDetected = useCallback(async (result) => {
    if (!result || !result.codeResult) return;
    const code = result.codeResult.code;
    if (!code || isLoading || pendingProduct) return;

    if (lastDetectedCodeRef.current !== code) {
      lastDetectedCodeRef.current = code;
      scanAttemptsRef.current = 1;
    } else {
      scanAttemptsRef.current += 1;
    }

    setIsLoading(true);

    const productName = await fetchProductName(code);

    if (productName) {
      setPendingProduct({ code, nom: productName, found: true });
    } else if (scanAttemptsRef.current >= 5) {
      setPendingProduct({ code, nom: "", found: false });
    }

    setIsLoading(false);
  }, [isLoading, pendingProduct]);

  const confirmAdd = () => {
    if (pendingProduct.nom.trim()) {
      addToStock({
        code: pendingProduct.code,
        nom: pendingProduct.nom.trim()
      });
    }
    resetScannerState();
  };

  const cancelAdd = () => {
    resetScannerState();
  };

  const resetScannerState = () => {
    setPendingProduct(null);
    lastDetectedCodeRef.current = null;
    scanAttemptsRef.current = 0;
  };

  const onNomChange = (e) => {
    setPendingProduct((prev) => ({ ...prev, nom: e.target.value }));
  };

  useEffect(() => {
    if (scanning) {
      if (!scannerRef.current) return;

      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: scannerRef.current,
            constraints: { facingMode: "environment" },
          },
          decoder: { readers: ["ean_reader", "ean_8_reader", "upc_reader"] },
          locate: true,
        },
        (err) => {
          if (err) {
            console.error("Quagga init error:", err);
            setScanning(false);
            return;
          }
          Quagga.start();
          quaggaStartedRef.current = true;
          Quagga.onDetected(onDetected);
        }
      );
    } else {
      if (quaggaStartedRef.current) {
        Quagga.offDetected(onDetected);
        Quagga.stop();
        quaggaStartedRef.current = false;
      }
    }

    return () => {
      if (quaggaStartedRef.current) {
        Quagga.offDetected(onDetected);
        Quagga.stop();
        quaggaStartedRef.current = false;
      }
    };
  }, [scanning]);

  // 🔴 GÈRE L'ÉCOUTE SELON `pendingProduct`
  useEffect(() => {
    if (!quaggaStartedRef.current) return;

    if (pendingProduct) {
      Quagga.offDetected(onDetected);
    } else {
      Quagga.onDetected(onDetected);
    }
  }, [pendingProduct, onDetected]);

  const isDetectionActive = scanning && !pendingProduct && !isLoading;

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


      </div>
    </div>
  );
}
