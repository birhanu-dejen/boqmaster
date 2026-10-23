"""Excel (.xlsx) export for a BOQ.

Layout mirrors the BOQ UI / reference export:

    title / app name / summary line
    column headers
    per section: section row (with total), positions, "Subtotal: ..." row, blank row
    COST SUMMARY: Direct Cost, markups (optional), Net Total, + VAT, GROSS TOTAL
    footer

Section, subtotal and summary figures are real Excel formulas, so the sheet
stays editable and recalculates when a quantity or rate is changed.
"""

import re
from datetime import date
from decimal import Decimal
from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from app.models.boq import Boq
from app.models.boq_section import BoqSection

APP_NAME = "Boqmaster"
APP_URL = "Boqmaster.com"

HEADERS = ["No.", "Description", "Unit", "Quantity", "Unit Rate", "Total"]
COL_WIDTHS = [14, 56, 9, 14, 16, 18]
NUM_FMT = "#,##0.00"

SECTION_FILL = PatternFill("solid", fgColor="F3F4F6")
HEADER_BORDER = Border(bottom=Side(style="thin", color="9CA3AF"))
THIN = Side(style="thin", color="D1D5DB")
BOTTOM = Border(bottom=THIN)
GROSS_BORDER = Border(
    top=Side(style="medium", color="111827"),
    bottom=Side(style="double", color="111827"),
)


def export_filename(boq: Boq) -> str:
    base = re.sub(r"[^\w\- ]+", "", boq.name, flags=re.UNICODE)
    base = re.sub(r"\s+", " ", base).strip() or "boq"
    return f"{base}.xlsx"


def _children(boq: Boq, parent_id: int | None) -> list[BoqSection]:
    return sorted(
        (s for s in boq.sections if s.parent_id == parent_id),
        key=lambda s: (s.sort_order, s.id),
    )


def _section_total(boq: Boq, section: BoqSection) -> Decimal:
    own = sum(
        (Decimal(str(p.quantity)) * Decimal(str(p.unit_rate)) for p in section.positions),
        Decimal(0),
    )
    return own + sum((_section_total(boq, c) for c in _children(boq, section.id)), Decimal(0))


def _markups(boq: Boq) -> list:
    """Optional markups (overhead, profit, ...). Each needs `name` and `percentage`."""
    return list(getattr(boq, "markups", None) or [])


def _vat_rate(boq: Boq) -> Decimal:
    return Decimal(str(getattr(boq, "vat_rate", 0) or 0))


def _fmt_date(d: date) -> str:
    return f"{d:%B} {d.day}, {d.year}"


def build_boq_xlsx(boq: Boq) -> BytesIO:
    wb = Workbook()
    ws = wb.active
    ws.title = "BOQ"

    today = date.today()
    top_sections = _children(boq, None)

    # ── summary figures for the header line (cells below stay formulas) ──
    direct_cost = sum((_section_total(boq, s) for s in top_sections), Decimal(0))
    markups = _markups(boq)
    net_total = direct_cost + sum(
        (direct_cost * Decimal(str(m.percentage)) / 100 for m in markups), Decimal(0)
    )
    vat_rate = _vat_rate(boq)
    gross_total = net_total + net_total * vat_rate / 100
    n_sections = len(boq.sections)
    n_positions = sum(len(s.positions) for s in boq.sections)

    # ── title block ────────────────────────────────────────────────
    ws["A1"] = f"BILL OF QUANTITIES - {boq.name}"
    ws["A1"].font = Font(bold=True, size=13)
    ws["A2"].font = Font(color="6B7280")
    ws["A3"] = (
        f"Date: {_fmt_date(today)}  |  {n_sections} sections  |  "
        f"{n_positions} positions  |  Gross Total: {gross_total:,.2f}"
    )
    ws["A3"].font = Font(color="6B7280")

    # ── column headers (row 5) ─────────────────────────────────────
    header_row = 5
    for col, label in enumerate(HEADERS, start=1):
        c = ws.cell(row=header_row, column=col, value=label)
        c.font = Font(bold=True)
        c.border = HEADER_BORDER
        c.alignment = Alignment(
            horizontal="right" if col >= 4 else "left", vertical="center"
        )
    for col, width in enumerate(COL_WIDTHS, start=1):
        ws.column_dimensions[get_column_letter(col)].width = width
    ws.freeze_panes = ws.cell(row=header_row + 1, column=1)

    row = header_row + 1

    def write_section(section: BoqSection, depth: int) -> int:
        """Writes section row, positions, nested sections and subtotal row.
        Returns the row holding the section's total (own + nested)."""
        nonlocal row
        section_row = row
        row += 1

        ws.cell(row=section_row, column=1, value=section.ordinal).alignment = Alignment(
            indent=depth
        )
        ws.cell(row=section_row, column=2, value=section.title).alignment = Alignment(
            indent=depth
        )
        for col in range(1, 7):
            c = ws.cell(row=section_row, column=col)
            c.font = Font(bold=True)
            c.fill = SECTION_FILL
            c.border = BOTTOM

        # positions
        positions = sorted(section.positions, key=lambda p: (p.sort_order, p.id))
        first_pos = row
        for p in positions:
            ws.cell(row=row, column=1, value=p.ordinal).alignment = Alignment(
                indent=depth
            )
            d = ws.cell(row=row, column=2, value=p.description)
            d.alignment = Alignment(wrap_text=True, vertical="top", indent=depth)
            ws.cell(row=row, column=3, value=p.unit).alignment = Alignment(
                horizontal="left"
            )
            q = ws.cell(row=row, column=4, value=float(p.quantity))
            q.number_format = NUM_FMT
            r = ws.cell(row=row, column=5, value=float(p.unit_rate))
            r.number_format = NUM_FMT
            t = ws.cell(row=row, column=6, value=f"=D{row}*E{row}")
            t.number_format = NUM_FMT
            for col in range(1, 7):
                ws.cell(row=row, column=col).border = BOTTOM
            row += 1
        last_pos = row - 1

        # sub-sections
        child_rows = [write_section(c, depth + 1) for c in _children(boq, section.id)]

        # section total = own positions + nested sections
        parts = []
        if positions:
            parts.append(f"SUM(F{first_pos}:F{last_pos})")
        parts += [f"F{r}" for r in child_rows]
        total = ws.cell(
            row=section_row, column=6, value=("=" + "+".join(parts)) if parts else 0
        )
        total.number_format = NUM_FMT

        # subtotal row
        sub = ws.cell(row=row, column=2, value=f"Subtotal: {section.title}")
        sub.font = Font(bold=True)
        sub.alignment = Alignment(indent=depth)
        st = ws.cell(row=row, column=6, value=f"=F{section_row}")
        st.number_format = NUM_FMT
        st.font = Font(bold=True)
        row += 2  # subtotal row + blank spacer row
        return section_row

    top_rows = [write_section(s, 0) for s in top_sections]

    # ── cost summary ───────────────────────────────────────────────
    row += 1  # extra spacer, matches the reference layout
    ws.cell(row=row, column=2, value="COST SUMMARY").font = Font(bold=True, size=12)
    row += 1

    direct_row = row
    ws.cell(row=row, column=2, value="Direct Cost")
    c = ws.cell(
        row=row,
        column=6,
        value=("=" + "+".join(f"F{r}" for r in top_rows)) if top_rows else 0,
    )
    c.number_format = NUM_FMT
    row += 1

    markup_rows = []
    for m in markups:
        pct = Decimal(str(m.percentage))
        ws.cell(row=row, column=2, value=f"+ {m.name} ({pct.normalize():f}%)")
        c = ws.cell(row=row, column=6, value=f"=F{direct_row}*{float(pct) / 100}")
        c.number_format = NUM_FMT
        markup_rows.append(row)
        row += 1

    row += 1  # blank
    net_row = row
    ws.cell(row=row, column=2, value="Net Total").font = Font(bold=True)
    c = ws.cell(
        row=row,
        column=6,
        value="=" + "+".join([f"F{direct_row}"] + [f"F{r}" for r in markup_rows]),
    )
    c.number_format = NUM_FMT
    c.font = Font(bold=True)
    row += 1

    vat_row = row
    ws.cell(row=row, column=2, value=f"+ VAT ({vat_rate.normalize():f}%)")
    c = ws.cell(row=row, column=6, value=f"=F{net_row}*{float(vat_rate) / 100}")
    c.number_format = NUM_FMT
    row += 2  # blank

    ws.cell(row=row, column=2, value="GROSS TOTAL")
    c = ws.cell(row=row, column=6, value=f"=F{net_row}+F{vat_row}")
    c.number_format = NUM_FMT
    for col in range(1, 7):
        cell = ws.cell(row=row, column=col)
        cell.font = Font(bold=True, size=12)
        cell.border = GROSS_BORDER
    row += 2

    # ── footer ─────────────────────────────────────────────────────
    ws.cell(
        row=row,
        column=1,
        
    ).font = Font(color="6B7280", size=9)

    # ── print setup ────────────────────────────────────────────────
    ws.page_setup.orientation = "portrait"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_title_rows = f"{header_row}:{header_row}"

    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf