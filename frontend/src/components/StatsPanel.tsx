import React from "react";
import { StatsResponse } from "../api";

interface Props {
  stats: StatsResponse | null;
  loading: boolean;
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onRefresh: () => void;
}

const MONTH_LABELS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export const StatsPanel: React.FC<Props> = ({
  stats,
  loading,
  year,
  month,
  onYearChange,
  onMonthChange,
  onRefresh,
}) => {
  const nowYear = new Date().getFullYear();

  const years = [];
  for (let y = nowYear - 5; y <= nowYear + 1; y += 1) {
    years.push(y);
  }

  return (
    <div className="stats">
      <div className="stats-filters">
        <label>
          Месяц
          <select
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
          >
            {MONTH_LABELS.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Год
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn secondary" onClick={onRefresh}>
          Обновить
        </button>
      </div>

      {loading && <div>Загрузка...</div>}
      {!loading && stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Доходы</div>
            <div className="stat-value income">
              {stats.income.toFixed(2)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Расходы</div>
            <div className="stat-value expense">
              {stats.expense.toFixed(2)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Баланс</div>
            <div className="stat-value">
              {stats.balance.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

