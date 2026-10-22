"""Excel (.xlsx) export for a BOQ.

Section and position totals are written as real Excel formulas, so the sheet
stays editable and recalculates when a quantity or rate is changed.
"""

import re
from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from app.models.boq import Boq
from app.models.boq_section import BoqSection

HEADERS = ["Pos.", "Description", "Unit", "Quantity", "Unit Rate", "Total"]
COL_WIDTHS = [16, 52, 9, 14, 16, 18]
NUM_FMT = "#,##0.00"
QTY_FMT = "#,##0.00##"

HEADER_FILL = PatternFill("solid", fgColor="1F2937")
SECTION_FILLS = [
    PatternFill("solid", fgColor="E5E7EB"),  # top level
    PatternFill("solid", fgColor="F3F4F6"),  # sub-section
    PatternFill("solid", fgColor="F9FAFB"),  # deeper
]
THIN = Side(style="thin", color="D1D5DB")
BOTTOM = Border(bottom=THIN)
TOP_BOTTOM = Border(top=Side(style="medium", color="111827"), bottom=THIN)


def export_filename(boq: Boq) -> str:
    base = re.sub(r"[^\w\- ]+", "", boq.name, flags=re.UNICODE)
    base = re.sub(r"\s+", " ", base).strip() or "boq"
    return f"{base}.xlsx"


def _children(boq: Boq, parent_id: int | None) -> list[BoqSection]:
    return sorted(
        (s for s in boq.sections if s.parent_id == parent_id),
        key=lambda s: (s.sort_order, s.id),
    )


def build_boq_xlsx(boq: Boq) -> BytesIO:
    wb = Workbook()
    ws = wb.active
    ws.title = "BOQ"

    # ── title block ────────────────────────────────────────────────
    ws["A1"] = boq.name
    ws["A1"].font = Font(bold=True, size=14)
    ws["A2"] = f"Currency: {boq.currency}"
    ws["A2"].font = Font(color="6B7280")

    # ── column headers ─────────────────────────────────────────────
    header_row = 4
    for col, label in enumerate(HEADERS, start=1):
        c = ws.cell(row=header_row, column=col, value=label)
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = HEADER_FILL
        c.alignment = Alignment(
            horizontal="right" if col >= 4 else "left", vertical="center"
        )
    for col, width in enumerate(COL_WIDTHS, start=1):
        ws.column_dimensions[get_column_letter(col)].width = width
    ws.freeze_panes = ws.cell(row=header_row + 1, column=1)

    row = header_row + 1

    def write_section(section: BoqSection, depth: int) -> int:
        """Writes a section, its positions and sub-sections.
        Returns the row holding the section's total (own + nested)."""
        nonlocal row
        section_row = row
        row += 1

        fill = SECTION_FILLS[min(depth, len(SECTION_FILLS) - 1)]
        a = ws.cell(row=section_row, column=1, value=section.ordinal)
        a.alignment = Alignment(indent=depth)
        ws.cell(row=section_row, column=2, value=section.title.upper())
        for col in range(1, 7):
            c = ws.cell(row=section_row, column=col)
            c.font = Font(bold=True)
            c.fill = fill
            c.border = BOTTOM

        # positions
        positions = sorted(section.positions, key=lambda p: (p.sort_order, p.id))
        first_pos = row
        for p in positions:
            ws.cell(row=row, column=1, value=p.ordinal).alignment = Alignment(
                indent=depth + 1
            )
            d = ws.cell(row=row, column=2, value=p.description)
            d.alignment = Alignment(wrap_text=True, vertical="top")
            ws.cell(row=row, column=3, value=p.unit).alignment = Alignment(
                horizontal="center"
            )
            q = ws.cell(row=row, column=4, value=float(p.quantity))
            q.number_format = QTY_FMT
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
            row=section_row, column=6, value="=" + "+".join(parts) if parts else 0
        )
        total.number_format = NUM_FMT
        return section_row

    top_rows = [write_section(s, 0) for s in _children(boq, None)]

    # ── grand total ────────────────────────────────────────────────
    ws.cell(row=row, column=2, value="DIRECT COST")
    gt = ws.cell(
        row=row,
        column=6,
        value="=" + "+".join(f"F{r}" for r in top_rows) if top_rows else 0,
    )
    gt.number_format = NUM_FMT
    for col in range(1, 7):
        c = ws.cell(row=row, column=col)
        c.font = Font(bold=True, size=12)
        c.border = TOP_BOTTOM

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