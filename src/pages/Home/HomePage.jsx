import React, { useContext } from 'react';
import 'styles/HomePage.css';
import { StockContext } from 'context/StockContext';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const { stock, idealStock } = useContext(StockContext);
  
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
        <div className="hero-visual">
          <div className="floating-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <div className="card-title">Votre stock en un coup d'œil</div>
              <div className="card-stats">
                <span>{totalProducts} produits</span>
                <span>{totalStock} articles</span>
              </div>
            </div>
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