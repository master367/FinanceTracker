import React, { useState } from "react";
import { TransactionCreate, TransactionType } from "../api";

interface Props {
  onSubmit: (payload: TransactionCreate) => void | Promise<void>;
  defaultType: TransactionType;
}

export const TransactionForm: React.FC<Props> = ({ onSubmit, defaultType }) => {
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [type, setType] = useState<TransactionType>(defaultType);
  const [category, setCategory] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (Number.isNaN(parsed) || parsed < 0) {
      alert("Сумма должна быть неотрицательным числом");
      return;
    }
    const payload: TransactionCreate = {
      amount: parsed,
      description: description.trim() || undefined,
      type,
      category: category.trim() || undefined,
      tags: tags.trim() || undefined,
    };
    try {
      setSubmitting(true);
      await onSubmit(payload);
      setAmount("");
      setDescription("");
      setCategory("");
      setTags("");
      setType(defaultType);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="grid-2x2" style={{ marginBottom: '8px' }}>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00 ₸"
          required
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
        >
          <option value="expense">Расход</option>
          <option value="income">Доход</option>
        </select>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Категория (Продукты, транспорт...)"
        />
      </div>

      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание (Краткий комментарий)"
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Теги (еда, дом, машина)"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? "..." : "＋ Добавить"}
      </button>
    </form>
  );
};

