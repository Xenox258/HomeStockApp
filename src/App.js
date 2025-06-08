import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'; 
import { StockProvider } from './StockContext';
import HomePage from './HomePage';
import ScannerStockApp from './ScannerStockApp';
import IdealStockPage from './IdealStockPage';
import ShoppingListPage from './ShoppingListPage';
import StockPage from './StockPage';
import './CSS/App.css';

export default function App() {
  return (
    <StockProvider>
      <BrowserRouter>
        <div className="app">
          <nav className="navbar">
            <div className="nav-container">
              <Link to="/home" className="nav-title-link">
                <h2 className="nav-title">📦 Gestion Stock</h2>
              </Link>
              <ul className="nav-menu">
                <li><Link to="/scanner" className="nav-link">📱 Scanner</Link></li>
                <li><Link to="/stock" className="nav-link">📋 Stock Actuel</Link></li>
                <li><Link to="/ideal-stock" className="nav-link">🎯 Stock Cible</Link></li>
                <li><Link to="/shopping-list" className="nav-link">🛒 Liste de Courses</Link></li>
              </ul>
            </div>
          </nav>
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/scanner" element={<ScannerStockApp />} />
              <Route path="/stock" element={<StockPage />} />
              <Route path="/ideal-stock" element={<IdealStockPage />} />
              <Route path="/shopping-list" element={<ShoppingListPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </StockProvider>
  );
}