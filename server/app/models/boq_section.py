from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.boq import Boq
    from app.models.boq_position import BoqPosition


class BoqSection(Base):
    __tablename__ = "boq_sections"
    __table_args__ = (UniqueConstraint("boq_id", "ordinal"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    boq_id: Mapped[int] = mapped_column(
        ForeignKey("boqs.id", ondelete="CASCADE"), index=True
    )
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("boq_sections.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    ordinal: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(255))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    boq: Mapped["Boq"] = relationship(back_populates="sections")
    parent: Mapped["BoqSection | None"] = relationship(
        back_populates="children", remote_side=[id]
    )
    children: Mapped[list["BoqSection"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )
    positions: Mapped[list["BoqPosition"]] = relationship(
        back_populates="section",
        cascade="all, delete-orphan",
        order_by="BoqPosition.sort_order",
    )