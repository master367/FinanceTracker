import axios from "axios";

/**
 * Single entry point for ALL backend traffic — the API Gateway.
 *
 * Routing handled by gateway_service (FastAPI + httpx):
 *   /api/v1/finance/*   → finance-api:8000  (internal Docker network)
 *   /api/v1/analytics/* → analytics-api:8000 (internal Docker network)
 */
export const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || "http://127.0.0.1:8080";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: number;
  amount: number;
  description?: string | null;
  type: TransactionType;
  category?: string | null;
  created_at: string;
  tags?: string | null;
}

export interface TransactionCreate {
  amount: number;
  description?: string;
  type: TransactionType;
  category?: string;
  tags?: string;
}

export interface TransactionUpdate {
  amount?: number;
  description?: string;
  type?: TransactionType;
  category?: string;
  tags?: string;
}

export interface StatsResponse {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
}

// ---- Analytics types ----

export interface AnalyticsTransaction {
  id: number;
  amount: number;
  category: string | null;
  date: string; // ISO date "YYYY-MM-DD"
  type: TransactionType;
}

export interface ForecastResponse {
  forecast_30d: number;
  avg_daily: number;
  data_days: number;
  total_spent?: number;
  message?: string;
}

// ---- Axios clients ----
// Both clients hit the same gateway host; only the base-path differs.

const financeClient = axios.create({
  baseURL: `${GATEWAY_URL}/api/v1/finance`,
});

const analyticsClient = axios.create({
  baseURL: `${GATEWAY_URL}/api/v1/analytics`,
});

// ---- Finance API ----

export async function fetchTransactions(params?: {
  from_date?: string;
  to_date?: string;
  category?: string;
  tags?: string[];
}): Promise<Transaction[]> {
  const response = await financeClient.get<Transaction[]>("/transactions", { params });
  return response.data;
}

export async function createTransaction(payload: TransactionCreate): Promise<Transaction> {
  const response = await financeClient.post<Transaction>("/transactions", payload);
  return response.data;
}

export async function updateTransaction(
  id: number,
  payload: TransactionUpdate,
): Promise<Transaction> {
  const response = await financeClient.put<Transaction>(`/transactions/${id}`, payload);
  return response.data;
}

export async function deleteTransaction(id: number): Promise<void> {
  await financeClient.delete(`/transactions/${id}`);
}

export async function fetchStats(year: number, month: number): Promise<StatsResponse> {
  const response = await financeClient.get<StatsResponse>("/stats", {
    params: { year, month },
  });
  return response.data;
}

// ---- Analytics API ----

/** Map Transaction[] to the shape expected by analytics_service */
function toAnalyticsPayload(transactions: Transaction[]): {
  transactions: AnalyticsTransaction[];
} {
  return {
    transactions: transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      category: t.category ?? null,
      date: t.created_at.slice(0, 10), // "YYYY-MM-DD"
      type: t.type,
    })),
  };
}

/**
 * POST /api/v1/analytics/api/analytics/pdf
 * Gateway strips /api/v1/analytics → upstream sees /api/analytics/pdf
 */
export async function downloadPdfReport(transactions: Transaction[]): Promise<void> {
  const response = await analyticsClient.post(
    "/api/analytics/pdf",
    toAnalyticsPayload(transactions),
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(
    new Blob([response.data as BlobPart], { type: "application/pdf" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "report.pdf";
  a.click();
  URL.revokeObjectURL(url);
}

/** POST /api/v1/analytics/api/analytics/chart → PNG blob URL */
export async function fetchChart(transactions: Transaction[]): Promise<string> {
  const response = await analyticsClient.post(
    "/api/analytics/chart",
    toAnalyticsPayload(transactions),
    { responseType: "blob" },
  );
  return URL.createObjectURL(
    new Blob([response.data as BlobPart], { type: "image/png" }),
  );
}

/** POST /api/v1/analytics/api/analytics/forecast → forecast JSON */
export async function fetchForecast(transactions: Transaction[]): Promise<ForecastResponse> {
  const response = await analyticsClient.post<ForecastResponse>(
    "/api/analytics/forecast",
    toAnalyticsPayload(transactions),
  );
  return response.data;
}

// ---- OCR API ----

export interface OcrScanResponse {
  message: string;
  transaction: Transaction;
}

/**
 * POST /api/v1/ocr/scan — uploads a receipt image as multipart/form-data.
 * Returns the transaction created in finance-api.
 */
export async function scanReceipt(file: File): Promise<OcrScanResponse> {
  const formData = new FormData();
  formData.append("file", file);
  // axios will set the correct multipart boundary automatically
  const response = await axios.post<OcrScanResponse>(
    `${GATEWAY_URL}/api/v1/ocr/scan`,
    formData,
  );
  return response.data;
}
