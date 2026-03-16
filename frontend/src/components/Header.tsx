import React from "react";
import { NavLink } from "react-router-dom";

export const Header: React.FC = () => {
  return (
    <header className="nav-header">
      <NavLink to="/" className="nav-logo">
        <span className="nav-logo-icon">💰</span>
        <span className="nav-logo-text">FinanceTracker</span>
      </NavLink>
      <nav className="nav-links">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          Главная
        </NavLink>
        <NavLink
          to="/finance"
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          Финансы
        </NavLink>
        <NavLink
          to="/analytics"
          className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
        >
          Аналитика
        </NavLink>
      </nav>
    </header>
  );
};
