import { useState, useRef } from "react";
import Quagga from "@ericblade/quagga2";

export default function App() {
  const [stock, setStock] = useState([]);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const onDetectedRef = useRef(null);

  // Flag pour savoir si Quagga est initialisé et en cours
  const quaggaStartedRef = useRef(false);

  const startScanner = () => {
    if (scanning) return;

    setScanning(true);

    // Nettoyage au cas où
    if (quaggaStartedRef.current) {
      Quagga.offDetected(onDetectedRef.current);
      Quagga.stop();
      quaggaStartedRef.current = false;
    }

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            facingMode: "environment",
            width: 640,
            height: 480,
          },
        },
        decoder: {
          readers: ["ean_reader", "upc_reader"],
        },
        locate: true,
      },
      (err) => {
        if (err) {
          console.error("Erreur Quagga init:", err);
          setScanning(false);
          return;
        }
        Quagga.start();
        quaggaStartedRef.current = true;
      }
    );

    onDetectedRef.current = (result) => {
      if (!result || !result.codeResult) return;
      const code = result.codeResult.code;
      if (!code) return;

      if (quaggaStartedRef.current) {
        Quagga.offDetected(onDetectedRef.current);
        Quagga.stop();
        quaggaStartedRef.current = false;
      }

      setScanning(false);

      if (scannerRef.current) scannerRef.current.innerHTML = "";

      setStock((prev) => {
        const found = prev.find((item) => item.code === code);
        if (found) {
          return prev.map((item) =>
            item.code === code
              ? { ...item, quantite: item.quantite + 1 }
              : item
          );
        } else {
          return [...prev, { code, nom: `Produit ${code}`, quantite: 1 }];
        }
      });
    };

    Quagga.onDetected(onDetectedRef.current);
  };

  const stopScanner = () => {
    if (quaggaStartedRef.current) {
      Quagga.offDetected(onDetectedRef.current);
      Quagga.stop();
      quaggaStartedRef.current = false;
    }
    setScanning(false);
    if (scannerRef.current) {
      scannerRef.current.innerHTML = "";
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h1>Scanner stock</h1>
      <button onClick={scanning ? stopScanner : startScanner}>
        {scanning ? "Stopper le scan" : "Démarrer le scan"}
      </button>

      {scanning && (
        <div
          ref={scannerRef}
          style={{
            width: "100%",
            height: 480,
            marginTop: 20,
            border: "2px solid #333",
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#000",
          }}
        />
      )}

      <ul style={{ marginTop: 30, padding: 0, listStyle: "none" }}>
        {stock.map(({ code, nom, quantite }) => (
          <li
            key={code}
            style={{
              backgroundColor: "#f0f0f0",
              padding: "8px 12px",
              borderRadius: 6,
              marginBottom: 8,
            }}
          >
            {nom} — Quantité : {quantite}
          </li>
        ))}
      </ul>
    </div>
  );
}
