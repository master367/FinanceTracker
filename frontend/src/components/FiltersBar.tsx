import React from "react";

interface Props {
  fromDate: string;
  toDate: string;
  category: string;
  tags: string;
  categories: string[];
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export const FiltersBar: React.FC<Props> = ({
  fromDate,
  toDate,
  category,
  tags,
  categories,
  onFromDateChange,
  onToDateChange,
  onCategoryChange,
  onTagsChange,
  onApply,
  onReset,
}) => {
  return (
    <div className="filters">
      <div className="filters-row">
        <label>
          С
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
          />
        </label>
        <label>
          По
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
          />
        </label>
        <label>
          Категория
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="">Все</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex-grow">
          Теги
          <input
            type="text"
            value={tags}
            onChange={(e) => onTagsChange(e.target.value)}
            placeholder="food,travel"
          />
        </label>
      </div>
      <div className="filters-actions">
        <button type="button" className="btn secondary" onClick={onReset}>
          Сбросить
        </button>
        <button type="button" className="btn primary" onClick={onApply}>
          Применить
        </button>
      </div>
    </div>
  );
};

