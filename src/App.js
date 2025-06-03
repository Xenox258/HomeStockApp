import { useState, useRef, useEffect } from "react";
import Quagga from "@ericblade/quagga2";

export default function ScannerStockApp() {
  const [scanning, setScanning] = useState(false);
  const [stock, setStock] = useState([]);
  const [pendingProduct, setPendingProduct] = useState(null);
  const scannerRef = useRef(null);
  const quaggaStartedRef = useRef(false);

  async function fetchProductName(code) {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${code}.json`
      );
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

  const onDetected = async (result) => {
    if (!result || !result.codeResult) return;
    const code = result.codeResult.code;
    if (!code) return;

    if (quaggaStartedRef.current) {
      Quagga.offDetected(onDetected);
      Quagga.stop();
      quaggaStartedRef.current = false;
      setScanning(false);
    }

    const vraiNom = (await fetchProductName(code)) || `Produit ${code}`;
    setPendingProduct({ code, nom: vraiNom });
  };

  // Confirmer ajout produit
  const confirmAdd = () => {
    setStock((prev) => {
      const found = prev.find((p) => p.code === pendingProduct.code);
      if (found) {
        return prev.map((p) =>
          p.code === pendingProduct.code
            ? { ...p, quantite: p.quantite + 1, nom: pendingProduct.nom }
            : p
        );
      } else {
        return [...prev, { ...pendingProduct, quantite: 1 }];
      }
    });
    setPendingProduct(null);
  };

  const cancelAdd = () => {
    setPendingProduct(null);
  };

  // Mise à jour du nom modifié dans le champ texte
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
          decoder: { readers: ["ean_reader", "upc_reader"] },
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
      if (scannerRef.current) {
        scannerRef.current.innerHTML = "";
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

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>Scanner et gestion du stock</h1>

      <button
        onClick={() => setScanning((v) => !v)}
        style={{
          padding: "10px 20px",
          fontSize: 16,
          cursor: "pointer",
          marginBottom: 20,
        }}
      >
        {scanning ? "Stopper le scan" : "Démarrer le scan"}
      </button>

      {scanning && (
        <div
          ref={scannerRef}
          style={{
            width: "100%",
            height: 400,
            border: "2px solid #333",
            marginBottom: 20,
            backgroundColor: "#000",
          }}
        />
      )}

      {pendingProduct && (
        <div
          style={{
            background: "#fff",
            border: "2px solid #333",
            padding: 20,
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <p>
            Confirmer l'ajout du produit :
          </p>
          <input
            type="text"
            value={pendingProduct.nom}
            onChange={onNomChange}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: 16,
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={confirmAdd}
            style={{ marginRight: 10, padding: "6px 12px", cursor: "pointer" }}
          >
            Confirmer
          </button>
          <button
            onClick={cancelAdd}
            style={{ padding: "6px 12px", cursor: "pointer" }}
          >
            Annuler
          </button>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {stock.map(({ code, nom, quantite }) => (
          <li
            key={code}
            style={{
              backgroundColor: "#eee",
              padding: 10,
              marginBottom: 8,
              borderRadius: 6,
              fontSize: 18,
            }}
          >
            {nom} — Quantité : {quantite}
          </li>
        ))}
      </ul>
    </div>
  );
}
