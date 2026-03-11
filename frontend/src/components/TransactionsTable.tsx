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
    const sign = t.type === "income" ? "+" : "-";
    return `${sign}${t.amount.toFixed(2)}`;
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("ru-RU", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Тип</th>
            <th>Категория</th>
            <th>Описание</th>
            <th>Теги</th>
            <th className="amount-col">Сумма</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td>{formatDateTime(t.created_at)}</td>
              <td>
                <span
                  className={
                    t.type === "income" ? "pill pill-income" : "pill pill-expense"
                  }
                >
                  {t.type === "income" ? "Доход" : "Расход"}
                </span>
              </td>
              <td>{t.category || "—"}</td>
              <td>{t.description || "—"}</td>
              <td>{t.tags || "—"}</td>
              <td className="amount-col">
                <span
                  className={
                    t.type === "income" ? "amount amount-income" : "amount amount-expense"
                  }
                >
                  {formatAmount(t)}
                </span>
              </td>
              <td className="actions-col">
                <button
                  type="button"
                  className="btn danger small"
                  onClick={() => onDelete(t.id)}
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

