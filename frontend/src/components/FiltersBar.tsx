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
    <>
    <div className="filters-row-flex">
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>С:</span>
        <input
          type="date"
          style={{ width: '130px' }}
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>По:</span>
        <input
          type="date"
          style={{ width: '130px' }}
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
        />
      </div>
      <select
        style={{ width: '150px' }}
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">Категория</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="text"
        style={{ width: '150px' }}
        value={tags}
        onChange={(e) => onTagsChange(e.target.value)}
        placeholder="Теги"
      />
      <button type="button" className="btn btn-secondary" style={{ fontSize: '13px', padding: '0 16px', height: '42px', width: 'auto' }} onClick={onReset}>
        Сбросить
      </button>
      <button type="button" className="btn btn-blue" style={{ fontSize: '13px', padding: '0 16px', height: '42px', width: 'auto' }} onClick={onApply}>
        Применить
      </button>
    </div>
    </>
  );
};

