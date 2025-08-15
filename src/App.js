import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import 'styles/App.css';
import 'styles/index.css';

import HomePage from 'pages/Home/HomePage.jsx';
import StockPage from 'pages/Stock/StockPage.jsx';
import IdealStockPage from 'pages/IdealStock/IdealStockPage.jsx';
import ShoppingListPage from 'pages/ShoppingList/ShoppingListPage.jsx';
import ScannerPage from 'pages/Scanner/ScannerPage.jsx';
import { StockProvider } from 'context/StockContext';
import Navbar from 'components/common/Navbar';

function AppContent() {
  const location = useLocation();
  const showNavbar = location.pathname !== '/';

  return (
    <div className="app">
      {showNavbar && <Navbar />}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/ideal-stock" element={<IdealStockPage />} />
          <Route path="/shopping-list" element={<ShoppingListPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StockProvider>
      <Router>
        <AppContent />
      </Router>
    </StockProvider>
  );
}