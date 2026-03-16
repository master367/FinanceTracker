import React, { useEffect, useState } from "react";
import {
  ForecastResponse,
  Transaction,
  downloadPdfReport,
  fetchChart,
  fetchForecast,
  fetchTransactions,
} from "../api";
import { Header } from "../components/Header";

type ActionState = "idle" | "loading" | "error";

export const AnalyticsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState<string | null>(null);

  // PDF
  const [pdfState, setPdfState] = useState<ActionState>("idle");
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Chart
  const [chartState, setChartState] = useState<ActionState>("idle");
  const [chartUrl, setChartUrl] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);

  // Forecast
  const [forecastState, setForecastState] = useState<ActionState>("idle");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [forecastError, setForecastError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchTransactions();
        setTransactions(data);
      } catch (e) {
        setTxError("Не удалось загрузить транзакции из Finance Service");
        console.error(e);
      } finally {
        setTxLoading(false);
      }
    })();
  }, []);

  // Derived summary stats
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const handlePdf = async () => {
    setPdfState("loading");
    setPdfError(null);
    try {
      await downloadPdfReport(transactions);
      setPdfState("idle");
    } catch (e) {
      setPdfState("error");
      setPdfError("Не удалось сгенерировать PDF-отчёт");
      console.error(e);
    }
  };

  const handleChart = async () => {
    setChartState("loading");
    setChartError(null);
    if (chartUrl) URL.revokeObjectURL(chartUrl);
    setChartUrl(null);
    try {
      const url = await fetchChart(transactions);
      setChartUrl(url);
      setChartState("idle");
    } catch (e) {
      setChartState("error");
      setChartError("Не удалось получить диаграмму");
      console.error(e);
    }
  };

  const handleForecast = async () => {
    setForecastState("loading");
    setForecastError(null);
    setForecast(null);
    try {
      const data = await fetchForecast(transactions);
      setForecast(data);
      setForecastState("idle");
    } catch (e) {
      setForecastState("error");
      setForecastError("Не удалось получить прогноз");
      console.error(e);
    }
  };

  return (
    <div className="page-wrapper">
      <Header />
      <main className="analytics-layout">
        <div className="hero-glow" style={{ opacity: 0.1 }} />
        
        {/* Block 1 — Overview stats */}
        <div className="grid-3-col" style={{ marginBottom: '32px' }}>
          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <div className="text-label">Транзакций</div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>{transactions.length}</div>
          </div>
          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <div className="text-label">Доходы</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-green)' }}>
              +{totalIncome.toLocaleString("ru-RU")} ₸
            </div>
          </div>
          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <div className="text-label">Расходы</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--danger-red)' }}>
              −{totalExpense.toLocaleString("ru-RU")} ₸
            </div>
          </div>
        </div>

        {/* Block 2 — Analytics grid */}
        <div className="grid-2x2">
          {/* Card 1 — PDF report */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '32px' }}>📄</div>
            <h2 className="card-title" style={{ margin: 0 }}>PDF-отчёт</h2>
            <div className="text-secondary" style={{ fontSize: '13px', flex: 1 }}>
              Полная выписка по всем операциям в формате PDF.
            </div>
            <button
              className="btn btn-blue"
              onClick={handlePdf}
              disabled={pdfState === "loading" || txLoading || transactions.length === 0}
            >
              {pdfState === "loading" ? "Загрузка..." : "Скачать отчёт"}
            </button>
          </div>

          {/* Card 2 — Expense chart */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '32px' }}>🥧</div>
            <h2 className="card-title" style={{ margin: 0 }}>Диаграмма расходов</h2>
            
            <div className="analytics-chart-wrapper">
              {chartUrl ? (
                <img src={chartUrl} alt="Expense chart" className="analytics-chart" />
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
                  Нажмите кнопку для анализа категорий
                </div>
              )}
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={handleChart}
              disabled={chartState === "loading" || transactions.length === 0}
            >
              {chartState === "loading" ? "Генерация..." : "Построить график"}
            </button>
          </div>

          {/* Card 3 — Monthly forecast */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px' }}>🔮</div>
              <div>
                <h2 className="card-title" style={{ margin: 0 }}>ИИ-Прогноз на месяц</h2>
                <div className="text-muted" style={{ fontSize: '12px' }}>На основе истории ваших трат</div>
              </div>
            </div>
            
            <div className="grid-4-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px' }}>
              <div>
                <div className="text-label" style={{ fontSize: '10px' }}>Прогноз (30 дн.)</div>
                <div style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: '20px' }}>
                  {forecast?.forecast_30d.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) ?? '0'} ₸
                </div>
              </div>
              <div>
                <div className="text-label" style={{ fontSize: '10px' }}>В день</div>
                <div style={{ fontWeight: 600, fontSize: '18px' }}>
                  {forecast?.avg_daily.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) ?? '0'} ₸
                </div>
              </div>
              <div>
                <div className="text-label" style={{ fontSize: '10px' }}>Дней данных</div>
                <div style={{ fontWeight: 600, fontSize: '18px' }}>{forecast?.data_days ?? '0'}</div>
              </div>
              <div>
                <div className="text-label" style={{ fontSize: '10px' }}>Всего трат</div>
                <div style={{ fontWeight: 600, fontSize: '18px' }}>
                  {forecast?.total_spent?.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) ?? '0'} ₸
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={handleForecast} 
              disabled={forecastState === "loading" || transactions.length === 0}
            >
              {forecastState === "loading" ? "Расчёт..." : "Обновить ИИ-прогноз"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px', color: 'var(--text-muted)', fontSize: '13px', opacity: 0.5 }}>
          Точность прогноза улучшается пропорционально количеству ваших транзакций
        </div>
      </main>
    </div>
  );
};
