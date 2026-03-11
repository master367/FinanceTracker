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
      <div className="app">
        {/* Summary card */}
        <div className="card analytics-summary-card">
          <h2 className="analytics-section-title">📊 Обзор данных</h2>
          {txLoading && <p className="analytics-loading">Загрузка транзакций…</p>}
          {txError && <div className="error-banner">{txError}</div>}
          {!txLoading && !txError && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Транзакций</div>
                <div className="stat-value">{transactions.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Доходы</div>
                <div className="stat-value income">+{totalIncome.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Расходы</div>
                <div className="stat-value expense">−{totalExpense.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="analytics-actions">
          {/* PDF */}
          <div className="analytics-action-card">
            <div className="analytics-action-icon">📄</div>
            <h3>PDF-отчёт</h3>
            <p>Таблица всех транзакций с итогами доходов и расходов</p>
            {pdfError && <div className="error-banner">{pdfError}</div>}
            <button
              type="button"
              className="btn primary"
              onClick={handlePdf}
              disabled={pdfState === "loading" || txLoading || transactions.length === 0}
            >
              {pdfState === "loading" ? "Генерация…" : "Скачать PDF-отчёт"}
            </button>
          </div>

          {/* Chart */}
          <div className="analytics-action-card">
            <div className="analytics-action-icon">🥧</div>
            <h3>Диаграмма расходов</h3>
            <p>Круговая диаграмма расходов по категориям</p>
            {chartError && <div className="error-banner">{chartError}</div>}
            <button
              type="button"
              className="btn primary"
              onClick={handleChart}
              disabled={chartState === "loading" || txLoading || transactions.length === 0}
            >
              {chartState === "loading" ? "Генерация…" : "Показать диаграмму"}
            </button>
            {chartUrl && (
              <div className="analytics-chart-wrapper">
                <img src={chartUrl} alt="Expense pie chart" className="analytics-chart" />
              </div>
            )}
          </div>

          {/* Forecast */}
          <div className="analytics-action-card">
            <div className="analytics-action-icon">🔮</div>
            <h3>Прогноз на месяц</h3>
            <p>Расчёт средних дневных расходов и прогноз на 30 дней</p>
            {forecastError && <div className="error-banner">{forecastError}</div>}
            <button
              type="button"
              className="btn primary"
              onClick={handleForecast}
              disabled={forecastState === "loading" || txLoading || transactions.length === 0}
            >
              {forecastState === "loading" ? "Расчёт…" : "Прогноз на месяц"}
            </button>
            {forecast && (
              <div className="forecast-card">
                {forecast.message && (
                  <p className="forecast-message">{forecast.message}</p>
                )}
                <div className="forecast-grid">
                  <div className="forecast-item">
                    <span className="forecast-label">Прогноз (30 дн.)</span>
                    <span className="forecast-value forecast-main">
                      {forecast.forecast_30d.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="forecast-item">
                    <span className="forecast-label">Среднее / день</span>
                    <span className="forecast-value">
                      {forecast.avg_daily.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="forecast-item">
                    <span className="forecast-label">Дней в данных</span>
                    <span className="forecast-value">{forecast.data_days}</span>
                  </div>
                  {forecast.total_spent !== undefined && (
                    <div className="forecast-item">
                      <span className="forecast-label">Потрачено всего</span>
                      <span className="forecast-value">
                        {forecast.total_spent.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
