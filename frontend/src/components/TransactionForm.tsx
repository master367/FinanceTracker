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
      <div className="form-row">
        <label>
          Сумма
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Тип
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="type"
                value="expense"
                checked={type === "expense"}
                onChange={() => setType("expense")}
              />
              Расход
            </label>
            <label>
              <input
                type="radio"
                name="type"
                value="income"
                checked={type === "income"}
                onChange={() => setType("income")}
              />
              Доход
            </label>
          </div>
        </label>
      </div>
      <div className="form-row">
        <label>
          Категория
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Например: продукты, зарплата"
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Описание
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткий комментарий"
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Теги
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Через запятую: дом,машина"
          />
        </label>
      </div>
      <div className="form-row">
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? "Сохранение..." : "Добавить"}
        </button>
      </div>
    </form>
  );
};

