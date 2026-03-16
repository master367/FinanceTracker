import io
from collections import defaultdict
from typing import Any

import matplotlib
import matplotlib.pyplot as plt

matplotlib.use("Agg")  # non-interactive backend — must be before pyplot import

def generate_chart(transactions: list[dict[str, Any]]) -> io.BytesIO:
    """Render a pie chart of expenses by category; returns PNG buffer."""

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
    
    # Assignment to a single variable and checking length fixes the "Tuple size mismatch" in some IDEs
    pie_output = ax.pie(
        sizes,
        labels=labels,
        colors=colors_cycle,
        autopct="%1.1f%%",
        startangle=140,
        pctdistance=0.82,
        wedgeprops={"linewidth": 1.5, "edgecolor": "#0f172a"},
    )
    
    # Unpack safely (wedges, texts, [autotexts])
    wedges = pie_output[0]
    texts = pie_output[1]
    autotexts = pie_output[2] if len(pie_output) > 2 else []

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
