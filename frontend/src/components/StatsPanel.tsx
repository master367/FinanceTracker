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
      <div className="form-row" style={{ gap: '6px', marginBottom: '12px' }}>
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
      </div>

      {loading && <div className="text-muted">Загрузка...</div>}
      {!loading && stats && (
        <div className="grid-3-col" style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '10px 12px' }}>
          <div className="stat-item">
            <div className="text-label" style={{ fontSize: '11px', marginBottom: '2px' }}>Доходы</div>
            <div className="amount-income" style={{ fontSize: '14px', fontWeight: 500 }}>
              {stats.income.toLocaleString("ru-RU")} ₸
            </div>
          </div>
          <div className="stat-item">
            <div className="text-label" style={{ fontSize: '11px', marginBottom: '2px' }}>Расходы</div>
            <div className="amount-expense" style={{ fontSize: '14px', fontWeight: 500 }}>
              {stats.expense.toLocaleString("ru-RU")} ₸
            </div>
          </div>
          <div className="stat-item">
            <div className="text-label" style={{ fontSize: '11px', marginBottom: '2px' }}>Баланс</div>
            <div className="text-primary" style={{ fontSize: '14px', fontWeight: 500 }}>
              {stats.balance.toLocaleString("ru-RU")} ₸
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

