import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { fetchStats, fetchTransactions, Transaction, StatsResponse } from "../api";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const monthName = now.toLocaleString('ru-RU', { month: 'long' });
  const year = now.getFullYear();

  useEffect(() => {
    async function loadData() {
      try {
        const statsData = await fetchStats(year, now.getMonth() + 1);
        const txData = await fetchTransactions();
        setStats(statsData);
        setRecentTransactions(txData.slice(0, 5));
      } catch (e) {
        console.error("Failed to load home page data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [year]);

  const handlePdfDownload = async () => {
    try {
      const { downloadPdfReport } = await import("../api");
      await downloadPdfReport(recentTransactions);
    } catch (e) {
      console.error("Failed to download PDF", e);
    }
  };

  return (
    <div className="page-wrapper">
      <Header />
      <main className="max-width-container" style={{ position: 'relative' }}>
        <div className="hero-glow" />
        
        {/* Block 1 — Balance hero card */}
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="text-label" style={{ fontSize: '13px', textTransform: 'none', opacity: 0.8 }}>
            Ваш текущий баланс · {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}
          </div>
          <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)', margin: '12px 0 32px', letterSpacing: '-0.03em' }}>
            {stats ? stats.balance.toLocaleString('ru-RU') : '0'} ₸
          </div>
          <div className="grid-3-col" style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px' }}>
            <div>
              <div className="text-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Доходы</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-green)' }}>
                +{stats ? stats.income.toLocaleString('ru-RU') : '0'} ₸
              </div>
            </div>
            <div>
              <div className="text-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Расходы</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--danger-red)' }}>
                −{stats ? stats.expense.toLocaleString('ru-RU') : '0'} ₸
              </div>
            </div>
            <div>
              <div className="text-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Операций</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-blue)' }}>
                {recentTransactions.length}
              </div>
            </div>
          </div>
        </div>

        {/* Block 2 — Quick actions */}
        <div className="text-label" style={{ marginBottom: '16px', marginLeft: '12px' }}>БЫСТРЫЕ ДЕЙСТВИЯ</div>
        <div className="grid-2x2" style={{ marginBottom: '40px' }}>
          <div className="card" style={{ padding: '20px', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s' }} onClick={() => navigate("/finance")}>
            <div style={{ fontSize: '24px', background: 'rgba(34, 197, 94, 0.1)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>➕</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>Новая транзакция</div>
              <div className="text-muted" style={{ fontSize: '12px' }}>Доход или расход</div>
            </div>
          </div>
          <div className="card" style={{ padding: '20px', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s' }} onClick={() => navigate("/finance#ocr")}>
            <div style={{ fontSize: '24px', background: 'rgba(14, 165, 233, 0.1)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>🧾</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>Распознать чек</div>
              <div className="text-muted" style={{ fontSize: '12px' }}>ИИ-сканирование</div>
            </div>
          </div>
          <div className="card" style={{ padding: '20px', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s' }} onClick={handlePdfDownload}>
            <div style={{ fontSize: '24px', background: 'rgba(255, 255, 255, 0.05)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>📄</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>PDF-отчёт</div>
              <div className="text-muted" style={{ fontSize: '12px' }}>Скачать выписку</div>
            </div>
          </div>
          <div className="card" style={{ padding: '20px', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s' }} onClick={() => navigate("/analytics")}>
            <div style={{ fontSize: '24px', background: 'rgba(239, 68, 68, 0.1)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>📊</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>Аналитика трат</div>
              <div className="text-muted" style={{ fontSize: '12px' }}>ИИ-прогноз и графики</div>
            </div>
          </div>
        </div>

        {/* Block 3 — Recent transactions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 12px' }}>
          <div className="text-label" style={{ margin: 0 }}>ПОСЛЕДНИЕ ОПЕРАЦИИ</div>
          <div style={{ fontSize: '12px', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate("/finance")}>Смотреть все →</div>
        </div>
        
        <div className="card" style={{ padding: '16px' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Тип</th>
                  <th>Категория</th>
                  <th>Описание</th>
                  <th style={{ textAlign: 'right' }}>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(t.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td>
                      <span className={`badge badge-${t.type === 'income' ? 'income' : 'expense'}`}>
                        {t.type === 'income' ? 'Доход' : 'Расход'}
                      </span>
                    </td>
                    <td>{t.category || '—'}</td>
                    <td>{t.description || '—'}</td>
                    <td className={`amount amount-${t.type === 'income' ? 'income' : 'expense'}`}>
                      {t.type === 'income' ? '+' : '−'}{t.amount.toLocaleString('ru-RU')} ₸
                    </td>
                  </tr>
                ))}
                {recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      История операций пуста
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
