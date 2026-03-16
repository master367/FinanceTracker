import React, { useEffect, useMemo, useState } from "react";
import {
  Transaction,
  TransactionCreate,
  TransactionType,
  createTransaction,
  deleteTransaction,
  fetchStats,
  fetchTransactions,
  scanReceipt,
} from "../api";
import { Header } from "../components/Header";
import { TransactionForm } from "../components/TransactionForm";
import { FiltersBar } from "../components/FiltersBar";
import { TransactionsTable } from "../components/TransactionsTable";
import { StatsPanel } from "../components/StatsPanel";

export const FinancePage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [tags, setTags] = useState<string>("");

  const [statsYear, setStatsYear] = useState<number>(new Date().getFullYear());
  const [statsMonth, setStatsMonth] = useState<number>(new Date().getMonth() + 1);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchStats>> | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // OCR state
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const uniqueCategories = useMemo(
    () =>
      Array.from(
        new Set(
          transactions
            .map((t) => t.category)
            .filter((c): c is string => Boolean(c && c.trim().length > 0)),
        ),
      ).sort(),
    [transactions],
  );

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const tagsArray =
        tags.trim().length > 0
          ? tags.split(",").map((t) => t.trim()).filter(Boolean)
          : undefined;
      const data = await fetchTransactions({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        category: category || undefined,
        tags: tagsArray,
      });
      setTransactions(data);
    } catch (e) {
      setError("Не удалось загрузить транзакции");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      setError(null);
      const data = await fetchStats(statsYear, statsMonth);
      setStats(data);
    } catch (e) {
      setError("Не удалось загрузить статистику");
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    void loadTransactions();
    void loadStats();
  }, []);

  const handleCreate = async (payload: TransactionCreate) => {
    try {
      setError(null);
      await createTransaction(payload);
      await loadTransactions();
      await loadStats();
    } catch (e) {
      setError("Ошибка при создании транзакции");
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить транзакцию?")) return;
    try {
      setError(null);
      await deleteTransaction(id);
      await loadTransactions();
      await loadStats();
    } catch (e) {
      setError("Ошибка при удалении транзакции");
      console.error(e);
    }
  };

  const handleOcrScan = async () => {
    if (!ocrFile) return;
    setOcrLoading(true);
    setOcrSuccess(null);
    setOcrError(null);
    try {
      const result = await scanReceipt(ocrFile);
      const t = result.transaction;
      setOcrSuccess(
        `✅ Сохранено: ${t.description ?? "Чек"} — ${t.amount.toLocaleString("ru-RU")} ₸`
      );
      setOcrFile(null);
      await loadTransactions();
      await loadStats();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка распознавания";
      setOcrError(msg);
      console.error(e);
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Header />
      <div className="finance-page-container">
        <div className="hero-glow" />
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Card 1 — New transaction form */}
          <div className="card" style={{ marginBottom: 0 }}>
            <h2 className="card-title">Новая операция</h2>
            <TransactionForm
              onSubmit={handleCreate}
              defaultType={"expense" satisfies TransactionType}
            />
          </div>

          {/* Card 2 — OCR scanner */}
          <div className="card" style={{ marginBottom: 0 }}>
            <h2 className="card-title">🧾 Сканировать чек</h2>
            <div className="ocr-card">
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '120px',
                  border: '2px dashed var(--card-border)',
                  borderRadius: '16px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  transition: 'background 0.3s'
                }}
                htmlFor="ocr-file-input"
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📸</div>
                {ocrFile ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{ocrFile.name}</span>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Нажмите для выбора фото</span>
                )}
                <input
                  id="ocr-file-input"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    setOcrFile(e.target.files?.[0] ?? null);
                    setOcrSuccess(null);
                    setOcrError(null);
                  }}
                />
              </label>

              <button
                type="button"
                className="btn btn-blue"
                style={{ marginTop: '12px' }}
                onClick={handleOcrScan}
                disabled={!ocrFile || ocrLoading}
              >
                {ocrLoading ? "..." : "Распознать и сохранить"}
              </button>

              {ocrSuccess && <div className="badge badge-income" style={{ marginTop: '8px', padding: '8px', textAlign: 'center', width: '100%' }}>{ocrSuccess}</div>}
              {ocrError && <div className="error-banner" style={{ marginTop: '8px' }}>{ocrError}</div>}
            </div>
          </div>

          {/* Card 3 — Monthly stats */}
          <div className="card" style={{ marginBottom: 0 }}>
            <h2 className="card-title">Статистика</h2>
            <StatsPanel
              stats={stats}
              loading={statsLoading}
              year={statsYear}
              month={statsMonth}
              onYearChange={setStatsYear}
              onMonthChange={setStatsMonth}
              onRefresh={loadStats}
            />
          </div>
        </div>

        {/* RIGHT COLUMN — Transactions table */}
        <div style={{ height: '100%' }}>
          <div className="card" style={{ minHeight: '100%', marginBottom: 0, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="card-title" style={{ margin: 0, fontSize: '18px' }}>История операций</h2>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={loadTransactions}
              >
                Обновить
              </button>
            </div>

            <FiltersBar
              fromDate={fromDate}
              toDate={toDate}
              category={category}
              tags={tags}
              categories={uniqueCategories}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              onCategoryChange={setCategory}
              onTagsChange={setTags}
              onApply={loadTransactions}
              onReset={() => {
                setFromDate("");
                setToDate("");
                setCategory("");
                setTags("");
                void loadTransactions();
              }}
            />

            <div style={{ borderBottom: '1px solid var(--card-border)', margin: '20px 0' }} />

            {transactions.some(t => !t.category) && (
              <div className="alert-banner">
                <span>💡</span>
                <span>Добавьте категории к операциям — это сделает ИИ-аналитику более точной.</span>
              </div>
            )}

            {error && <div className="error-banner">{error}</div>}
            <TransactionsTable
              transactions={transactions}
              loading={loading}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
