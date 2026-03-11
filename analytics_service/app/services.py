"""Pure-logic services for analytics: PDF, chart, forecast.

All functions accept a list of TransactionItem-like dicts and return
either a BytesIO buffer or a plain dict — no FastAPI dependencies.
"""

from __future__ import annotations

import io
from collections import defaultdict
from datetime import datetime
from typing import Any

# ---------------------------------------------------------------------------
# PDF Report
# ---------------------------------------------------------------------------

def generate_pdf(transactions: list[dict[str, Any]]) -> io.BytesIO:
    """Generate a PDF report table with income/expense rows and totals."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import (
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    story = []

    # Title
    story.append(Paragraph("Finance Tracker — Transaction Report", styles["Title"]))
    story.append(
        Paragraph(
            f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
            styles["Normal"],
        )
    )
    story.append(Spacer(1, 0.5 * cm))

    # Table header
    header = ["#", "Date", "Type", "Category", "Amount"]
    data = [header]

    total_income = 0.0
    total_expense = 0.0

    for i, t in enumerate(transactions, start=1):
        tx_type = str(t.get("type", "")).lower()
        amount = float(t.get("amount", 0))
        if tx_type == "income":
            total_income += amount
        else:
            total_expense += amount

        data.append(
            [
                str(i),
                str(t.get("date", "")),
                tx_type.capitalize(),
                str(t.get("category", "") or "—"),
                f"{amount:,.2f}",
            ]
        )

    # Totals footer
    data.append(["", "", "", "Total Income:", f"{total_income:,.2f}"])
    data.append(["", "", "", "Total Expense:", f"{total_expense:,.2f}"])
    data.append(["", "", "", "Balance:", f"{total_income - total_expense:,.2f}"])

    col_widths = [1 * cm, 3 * cm, 3 * cm, 5 * cm, 4 * cm]
    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(
        TableStyle(
            [
                # Header row
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                # Body rows
                ("FONTSIZE", (0, 1), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -4), [colors.white, colors.HexColor("#f8fafc")]),
                # Footer rows (last 3)
                ("FONTNAME", (0, -3), (-1, -1), "Helvetica-Bold"),
                ("BACKGROUND", (0, -3), (-1, -1), colors.HexColor("#f1f5f9")),
                # Grid
                ("GRID", (0, 0), (-1, -4), 0.5, colors.HexColor("#cbd5e1")),
                ("LINEABOVE", (0, -3), (-1, -3), 1, colors.HexColor("#0f172a")),
                ("ALIGN", (4, 0), (4, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 1), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
            ]
        )
    )

    story.append(tbl)
    doc.build(story)
    buf.seek(0)
    return buf


# ---------------------------------------------------------------------------
# Expense Pie Chart
# ---------------------------------------------------------------------------

def generate_chart(transactions: list[dict[str, Any]]) -> io.BytesIO:
    """Render a pie chart of expenses by category; returns PNG buffer."""
    import matplotlib
    matplotlib.use("Agg")  # non-interactive backend — must be before pyplot import
    import matplotlib.pyplot as plt

    # Aggregate expenses by category
    category_totals: dict[str, float] = defaultdict(float)
    for t in transactions:
        if str(t.get("type", "")).lower() == "expense":
            cat = str(t.get("category") or "Other")
            category_totals[cat] += float(t.get("amount", 0))

    if not category_totals:
        # Return a "no data" placeholder chart
        category_totals["No expenses"] = 1.0

    labels = list(category_totals.keys())
    sizes = list(category_totals.values())

    # Color palette matching the dark UI
    palette = [
        "#38bdf8", "#22c55e", "#f59e0b", "#ef4444",
        "#a855f7", "#ec4899", "#14b8a6", "#f97316",
        "#6366f1", "#84cc16",
    ]
    colors_cycle = (palette * ((len(labels) // len(palette)) + 1))[: len(labels)]

    fig, ax = plt.subplots(figsize=(7, 6), facecolor="#0f172a")
    wedges, texts, autotexts = ax.pie(
        sizes,
        labels=labels,
        colors=colors_cycle,
        autopct="%1.1f%%",
        startangle=140,
        pctdistance=0.82,
        wedgeprops={"linewidth": 1.5, "edgecolor": "#0f172a"},
    )

    for text in texts:
        text.set_color("#e5e7eb")
        text.set_fontsize(11)
    for autotext in autotexts:
        autotext.set_color("#0f172a")
        autotext.set_fontsize(9)
        autotext.set_fontweight("bold")

    ax.set_title("Expenses by Category", color="#e5e7eb", fontsize=14, pad=16)
    ax.set_facecolor("#0f172a")

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight", facecolor="#0f172a")
    plt.close(fig)
    buf.seek(0)
    return buf


# ---------------------------------------------------------------------------
# Monthly Forecast
# ---------------------------------------------------------------------------

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
