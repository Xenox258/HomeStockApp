import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { StockProvider } from './StockContext';
import ScannerStockApp from './ScannerStockApp';
import IdealStockPage from './IdealStockPage';
import ShoppingListPage from './ShoppingListPage';
import StockPage from './StockPage';

export default function App() {
  return (
    <StockProvider>
      <Router>
        <div>
          <nav>
            <ul>
              <li><Link to="/">Scanner</Link></li>
              <li><Link to="/stock">Stock Actuel</Link></li>
              <li><Link to="/ideal-stock">Stock Idéal</Link></li>
              <li><Link to="/shopping-list">Liste de Courses</Link></li>
            </ul>
          </nav>
          <Routes>
            <Route path="/" element={<ScannerStockApp />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/ideal-stock" element={<IdealStockPage />} />
            <Route path="/shopping-list" element={<ShoppingListPage />} />
          </Routes>
        </div>
      </Router>
    </StockProvider>
  );
}