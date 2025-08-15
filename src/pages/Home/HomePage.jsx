import React, { useContext, useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { StockContext } from "../../context/StockContext";
import "../../styles/HomePage.css";

export default function HomePage() {
  const { stock, idealStock } = useContext(StockContext);

  // Horloge dynamique
  const [now, setNow] = useState(() => new Date());
  const [battery, setBattery] = useState({ level: 0.69, charging: false, supported: false });

  useEffect(() => {
    const timerId = setInterval(() => setNow(new Date()), 30_000);

    const updateBatteryStatus = (batteryManager) => {
      setBattery({
        level: batteryManager.level,
        charging: batteryManager.charging,
        supported: true,
      });
    };

    if ('getBattery' in navigator) {
      navigator.getBattery().then(batteryManager => {
        updateBatteryStatus(batteryManager);
        batteryManager.onlevelchange = () => updateBatteryStatus(batteryManager);
        batteryManager.onchargingchange = () => updateBatteryStatus(batteryManager);
      });
    } else {
      // Fallback pour PC fixe ou navigateurs non supportés
      setBattery({ level: 1, charging: true, supported: false });
    }

    return () => clearInterval(timerId);
  }, []);

  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Seed pour relancer animations icônes à chaque montage
  const [animSeed] = useState(() => Date.now());
  
  // Calculs pour les statistiques
  const totalStock = stock.reduce((sum, item) => sum + item.quantite, 0);
  const totalProducts = stock.length;
  const targetProducts = idealStock.length;
  
  // Calcul des produits manquants
  const shoppingNeeded = idealStock.filter((ideal) => {
    const current = stock.find((s) => s.nom.toLowerCase().includes(ideal.nom.toLowerCase()));
    const currentQty = current ? current.quantite : 0;
    return currentQty < ideal.quantite;
  }).length;

  const quickActions = [
    {
      title: "Scanner un produit",
      description: "Ajouter des produits à votre stock en scannant leur code-barres",
      icon: "📱",
      color: "blue",
      link: "/scanner", // Correction: était "/" maintenant "/scanner"
      action: "Scanner"
    },
    {
      title: "Voir le stock",
      description: "Consulter et gérer tous vos produits en stock",
      icon: "📋",
      color: "green",
      link: "/stock",
      action: "Consulter"
    },
    {
      title: "Définir objectifs",
      description: "Configurer les quantités cibles pour chaque produit",
      icon: "🎯",
      color: "orange",
      link: "/ideal-stock",
      action: "Configurer"
    },
    {
      title: "Liste de courses",
      description: "Voir ce qu'il faut acheter selon vos objectifs",
      icon: "🛒",
      color: "red",
      link: "/shopping-list",
      action: "Consulter"
    }
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-icon">📦</span>
            Bienvenue dans votre
            <span className="highlight"> Gestionnaire de Stock</span>
          </h1>
          <p className="hero-description">
            Scannez, organisez et optimisez votre stock domestique en toute simplicité
          </p>
          <Link to="/scanner" className="hero-cta"> {/* Correction: était "/" maintenant "/scanner" */}
            📱 Commencer à scanner
          </Link>
        </div>

        {/* --- Nouveau visuel smartphone (remplace floating-card) --- */}
        <div className="hero-visual">
          {/* --- Smartphone --- */}
          <div className="phone-demo" key={animSeed}>
            <div className="phone-notch"></div>
            <div className="phone-screen">
              {/* Status bar */}
              <div className="cc-status">
                <div className="cc-time">{timeStr}</div>
                <div className="cc-bars"></div>
                <div className="cc-batt">
                  {battery.charging && '⚡️'} {Math.round(battery.level * 100)}%
                </div>
              </div>

              {/* Grille d'icônes */}
              <div className="app-grid">
                <Link to="/scanner" className="app-icon ai-scanner">
                  <span className="emoji">📷</span>
                  <span className="label">Scanner</span>
                </Link>
                <Link to="/stock" className="app-icon ai-stock">
                  <span className="emoji">📦</span>
                  <span className="label">Stock</span>
                </Link>
                <Link to="/ideal-stock" className="app-icon ai-objectifs">
                  <span className="emoji">🎯</span>
                  <span className="label">Objectifs</span>
                </Link>
                <Link to="/shopping-list" className="app-icon ai-courses">
                  <span className="emoji">🛒</span>
                  <span className="label">Courses</span>
                </Link>
              </div>

              <div className="phone-widget">
                <div className="widget-header">
                  <span>Aperçu Stock</span>
                  <span className="widget-dot" />
                </div>
                <div className="widget-stats">
                  <div className="ws-item">
                    <div className="ws-value">{totalProducts}</div>
                    <div className="ws-label">Produits</div>
                  </div>
                  <div className="ws-item">
                    <div className="ws-value">{totalStock}</div>
                    <div className="ws-label">Articles</div>
                  </div>
                  <div className="ws-item">
                    <div className="ws-value">{shoppingNeeded}</div>
                    <div className="ws-label">À acheter</div>
                  </div>
                </div>
                <Link to="/shopping-list" className="widget-cta">Liste →</Link>
              </div>
            </div>
            <div className="phone-shadow" />
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="stats-section">
        <h2 className="section-title">📊 Vue d'ensemble</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-value">{totalStock}</div>
            <div className="stat-label">Articles en stock</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏷️</div>
            <div className="stat-value">{totalProducts}</div>
            <div className="stat-label">Produits différents</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{targetProducts}</div>
            <div className="stat-label">Objectifs définis</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🛒</div>
            <div className="stat-value">{shoppingNeeded}</div>
            <div className="stat-label">À acheter</div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="actions-section">
        <h2 className="section-title">⚡ Actions rapides</h2>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <Link 
              key={index} 
              to={action.link} 
              className={`action-card ${action.color}`}
            >
              <div className="action-header">
                <div className="action-icon">{action.icon}</div>
                <div className="action-badge">{action.action}</div>
              </div>
              <h3 className="action-title">{action.title}</h3>
              <p className="action-description">{action.description}</p>
              <div className="action-arrow">→</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Section conseils */}
      <div className="tips-section">
        <h2 className="section-title">💡 Conseils d'utilisation</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">📱</div>
            <h3>Scanner efficacement</h3>
            <p>Assurez-vous que le code-barres est bien éclairé et centré dans le cadre pour une lecture optimale.</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🎯</div>
            <h3>Définir des objectifs</h3>
            <p>Configurez des quantités cibles réalistes selon vos habitudes de consommation.</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">📋</div>
            <h3>Gérer son stock</h3>
            <p>Mettez à jour régulièrement les quantités pour garder un inventaire précis.</p>
          </div>
        </div>
      </div>
    </div>
  );
}