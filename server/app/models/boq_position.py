from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.boq_section import BoqSection


class BoqPosition(Base):
    __tablename__ = "boq_positions"
    __table_args__ = (UniqueConstraint("section_id", "ordinal"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    section_id: Mapped[int] = mapped_column(
        ForeignKey("boq_sections.id", ondelete="CASCADE"), index=True
    )
    ordinal: Mapped[str] = mapped_column(String(32))
    description: Mapped[str] = mapped_column(Text, default="")
    unit: Mapped[str] = mapped_column(String(20), default="m²")
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=0)
    unit_rate: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    section: Mapped["BoqSection"] = relationship(back_populates="positions")