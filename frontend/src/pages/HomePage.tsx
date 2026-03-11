import React from "react";
import { useNavigate } from "react-router-dom";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="hero">
        <div className="hero-glow" />
        <h1 className="hero-title">
          <span className="hero-icon">💰</span>
          FinanceTracker
        </h1>
        <p className="hero-subtitle">
          Управляйте своими финансами и анализируйте расходы в одном месте
        </p>
        <div className="hero-cards">
          <button
            type="button"
            className="hero-card"
            onClick={() => navigate("/finance")}
          >
            <div className="hero-card-icon">📊</div>
            <div className="hero-card-label">Финансы</div>
            <div className="hero-card-desc">
              Управление транзакциями, статистика доходов и расходов
            </div>
            <div className="hero-card-arrow">→</div>
          </button>

          <button
            type="button"
            className="hero-card hero-card--analytics"
            onClick={() => navigate("/analytics")}
          >
            <div className="hero-card-icon">📈</div>
            <div className="hero-card-label">Аналитика</div>
            <div className="hero-card-desc">
              PDF-отчёты, диаграммы расходов и прогноз на месяц
            </div>
            <div className="hero-card-arrow">→</div>
          </button>
        </div>
      </div>
    </div>
  );
};
