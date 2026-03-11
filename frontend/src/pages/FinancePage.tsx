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
      <div className="app">
        <main className="layout">
          <section className="left-column">
            <div className="card">
              <h2>Новая транзакция</h2>
              <TransactionForm
                onSubmit={handleCreate}
                defaultType={"expense" satisfies TransactionType}
              />
            </div>

            <div className="card">
              <h2>Статистика за месяц</h2>
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

            <div className="card">
              <h2>📷 Сканировать чек</h2>
              <div className="ocr-card">
                <label className="ocr-dropzone" htmlFor="ocr-file-input">
                  {ocrFile
                    ? <span className="ocr-file-name">📄 {ocrFile.name}</span>
                    : <span className="ocr-placeholder">Выберите или перетащите фото чека</span>
                  }
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
                  className="btn primary"
                  onClick={handleOcrScan}
                  disabled={!ocrFile || ocrLoading}
                >
                  {ocrLoading ? "🧠 Нейросеть изучает чек…" : "Распознать чек"}
                </button>

                {ocrSuccess && <div className="ocr-success">{ocrSuccess}</div>}
                {ocrError   && <div className="error-banner">{ocrError}</div>}
              </div>
            </div>
          </section>

          <section className="right-column">
            <div className="card">
              <div className="card-header-row">
                <h2>Транзакции</h2>
                <button type="button" className="btn secondary" onClick={loadTransactions}>
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
              {error && <div className="error-banner">{error}</div>}
              <TransactionsTable
                transactions={transactions}
                loading={loading}
                onDelete={handleDelete}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
