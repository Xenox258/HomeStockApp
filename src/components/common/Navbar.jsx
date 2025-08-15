import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import 'styles/App.css';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-title-link" onClick={close} style={{ textDecoration: 'none' }}>
          <div className="nav-title gradient-logo">HomeStockApp</div>
        </Link>
        <button
          className={'nav-toggle' + (open ? ' open' : '')}
            onClick={() => setOpen(o => !o)}
            aria-label="Menu"
        >
          <span />
          <span />
          <span />
        </button>
        <ul className={'nav-menu' + (open ? ' show' : '')}>
          <li><NavLink onClick={close} to="/" end className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')} style={{ textDecoration: 'none' }}>Accueil</NavLink></li>
          <li><NavLink onClick={close} to="/scanner" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')} style={{ textDecoration: 'none' }}>Scanner</NavLink></li>
          <li><NavLink onClick={close} to="/stock" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')} style={{ textDecoration: 'none' }}>Stock</NavLink></li>
          <li><NavLink onClick={close} to="/ideal-stock" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')} style={{ textDecoration: 'none' }}>Objectifs</NavLink></li>
          <li><NavLink onClick={close} to="/shopping-list" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')} style={{ textDecoration: 'none' }}>Courses</NavLink></li>
        </ul>
      </div>
    </nav>
  );
}