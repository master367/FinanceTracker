import React from "react";
import { Transaction } from "../api";

interface Props {
  transactions: Transaction[];
  loading: boolean;
  onDelete: (id: number) => void;
}

export const TransactionsTable: React.FC<Props> = ({
  transactions,
  loading,
  onDelete,
}) => {
  if (loading) {
    return <div className="table-placeholder">Загрузка...</div>;
  }

  if (!transactions.length) {
    return <div className="table-placeholder">Пока нет транзакций</div>;
  }

  const formatAmount = (t: Transaction) => {
    const formatted = t.amount.toLocaleString("ru-RU");
    return `${formatted} ₸`;
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Тип</th>
            <th>Категория</th>
            <th>Описание</th>
            <th>Теги</th>
            <th style={{ textAlign: 'right' }}>Сумма</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td style={{ color: 'var(--text-secondary)' }}>{formatDateTime(t.created_at)}</td>
              <td>
                <span
                  className={
                    t.type === "income" ? "badge badge-income" : "badge badge-expense"
                  }
                >
                  {t.type === "income" ? "Доход" : "Расход"}
                </span>
              </td>
              <td>{t.category || "—"}</td>
              <td>{t.description || "—"}</td>
              <td>{t.tags || "—"}</td>
              <td className={`amount ${t.type === "income" ? 'amount-income' : 'amount-expense'}`}>
                {formatAmount(t)}
              </td>
              <td style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '24px', height: '24px', padding: 0, fontSize: '10px', borderRadius: '4px', cursor: 'pointer', color: 'var(--danger-red)' }}
                  onClick={() => onDelete(t.id)}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

