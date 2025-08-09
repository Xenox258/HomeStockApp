import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import 'styles/App.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-title-link">
          <div className="nav-title">HomeStockApp</div>
        </Link>
        <ul className="nav-menu">
          <li>
            <NavLink to="/" end className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>
              Accueil
            </NavLink>
          </li>
          <li>
            <NavLink to="/scanner" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>
              Scanner
            </NavLink>
          </li>
          <li>
            <NavLink to="/stock" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>
              Stock
            </NavLink>
          </li>
          <li>
            <NavLink to="/ideal-stock" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>
              Objectifs
            </NavLink>
          </li>
          <li>
            <NavLink to="/shopping-list" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>
              Courses
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}