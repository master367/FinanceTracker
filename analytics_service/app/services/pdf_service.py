import io
from datetime import datetime
from typing import Any

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

def generate_pdf(transactions: list[dict[str, Any]]) -> io.BytesIO:
    """Generate a PDF report table with income/expense rows and totals."""

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
