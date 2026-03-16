from collections import defaultdict
from typing import Any

def compute_forecast(transactions: list[dict[str, Any]]) -> dict[str, Any]:
    """Compute average daily expense and project it over 30 days."""
    daily_expense: dict[str, float] = defaultdict(float)

    for t in transactions:
        if str(t.get("type", "")).lower() == "expense":
            date_str = str(t.get("date", ""))
            if date_str:
                daily_expense[date_str] += float(t.get("amount", 0))

    if not daily_expense:
        return {
            "forecast_30d": 0.0,
            "avg_daily": 0.0,
            "data_days": 0,
            "message": "No expense data provided.",
        }

    data_days = len(daily_expense)
    total_spent = sum(daily_expense.values())
    avg_daily = total_spent / data_days
    forecast_30d = avg_daily * 30

    return {
        "forecast_30d": round(forecast_30d, 2),
        "avg_daily": round(avg_daily, 2),
        "data_days": data_days,
        "total_spent": round(total_spent, 2),
    }
