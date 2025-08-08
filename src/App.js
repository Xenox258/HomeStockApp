import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'styles/App.css';
import 'styles/index.css';

import HomePage from 'pages/Home/HomePage.jsx';
import StockPage from 'pages/Stock/StockPage.jsx';
import IdealStockPage from 'pages/IdealStock/IdealStockPage.jsx';
import ShoppingListPage from 'pages/ShoppingList/ShoppingListPage.jsx';
import ScannerPage from 'pages/Scanner/ScannerPage.jsx';
import { StockProvider } from 'context/StockContext';

export default function App() {
  return (
    <StockProvider>
      <div className="app">
        <Router>
          <div className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/scanner" element={<ScannerPage />} />
              <Route path="/stock" element={<StockPage />} />
              <Route path="/ideal-stock" element={<IdealStockPage />} />
              <Route path="/shopping-list" element={<ShoppingListPage />} />
            </Routes>
          </div>
        </Router>
      </div>
    </StockProvider>
  );
}