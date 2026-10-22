from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
from app.services.boq_export import build_boq_xlsx, export_filename
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.boq import Boq
from app.models.boq_position import BoqPosition
from app.models.boq_section import BoqSection
from app.models.user import User
from app.schemas.boq import (
    BoqDetail,
    PositionCreate,
    PositionRead,
    PositionUpdate,
    SectionCreate,
    SectionRead,
    SectionReorder,
    SectionUpdate,
)

router = APIRouter(tags=["boq"])


def _not_found(what: str) -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, f"{what} not found")


def _commit(db: Session) -> None:
    """Commit, turning a duplicate-code violation into a clean 409."""
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "That code is already used here"
        )


def _owned_boq(db: Session, boq_id: int, user: User) -> Boq:
    boq = db.get(Boq, boq_id)
    if not boq or boq.project.owner_id != user.id:
        raise _not_found("BOQ")
    return boq


def _owned_section(db: Session, section_id: int, user: User) -> BoqSection:
    section = db.get(BoqSection, section_id)
    if not section:
        raise _not_found("Section")
    _owned_boq(db, section.boq_id, user)
    return section


def _owned_position(db: Session, position_id: int, user: User) -> BoqPosition:
    position = db.get(BoqPosition, position_id)
    if not position:
        raise _not_found("Position")
    _owned_section(db, position.section_id, user)
    return position


# ── BOQ ─────────────────────────────────────────────────────────────


@router.get("/boqs/{boq_id}", response_model=BoqDetail)
def get_boq(
    boq_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return _owned_boq(db, boq_id, user)


# ── Sections ────────────────────────────────────────────────────────


@router.post(
    "/boqs/{boq_id}/sections",
    response_model=SectionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_section(
    boq_id: int,
    payload: SectionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    boq = _owned_boq(db, boq_id, user)

    if payload.parent_id is not None:
        parent = db.get(BoqSection, payload.parent_id)
        if not parent or parent.boq_id != boq.id:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "Invalid parent section"
            )

    next_order = (
        db.scalar(
            select(func.coalesce(func.max(BoqSection.sort_order), -1)).where(
                BoqSection.boq_id == boq.id
            )
        )
        + 1
    )
    section = BoqSection(
        boq_id=boq.id,
        parent_id=payload.parent_id,
        ordinal=payload.ordinal,
        title=payload.title,
        sort_order=next_order,
    )
    db.add(section)
    _commit(db)
    db.refresh(section)
    return section


@router.patch("/sections/{section_id}", response_model=SectionRead)
def update_section(
    section_id: int,
    payload: SectionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    section = _owned_section(db, section_id, user)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(section, key, value)
    _commit(db)
    db.refresh(section)
    return section


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.delete(_owned_section(db, section_id, user))
    _commit(db)


@router.post(
    "/boqs/{boq_id}/sections/reorder", status_code=status.HTTP_204_NO_CONTENT
)
def reorder_sections(
    boq_id: int,
    payload: SectionReorder,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    boq = _owned_boq(db, boq_id, user)
    by_id = {s.id: s for s in boq.sections}
    parents = {s.id: s.parent_id for s in boq.sections}

    for item in payload.items:
        if item.id not in by_id or (
            item.parent_id is not None and item.parent_id not in by_id
        ):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid section")
        parents[item.id] = item.parent_id

    # reject cycles (a section can't end up under itself)
    for start in parents:
        seen: set[int] = set()
        node: int | None = start
        while node is not None:
            if node in seen:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST, "Invalid hierarchy"
                )
            seen.add(node)
            node = parents[node]

    for index, item in enumerate(payload.items):
        by_id[item.id].parent_id = item.parent_id
        by_id[item.id].sort_order = index
    _commit(db)


# ── Positions ───────────────────────────────────────────────────────


@router.post(
    "/sections/{section_id}/positions",
    response_model=PositionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_position(
    section_id: int,
    payload: PositionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    section = _owned_section(db, section_id, user)
    next_order = (
        db.scalar(
            select(func.coalesce(func.max(BoqPosition.sort_order), -1)).where(
                BoqPosition.section_id == section.id
            )
        )
        + 1
    )
    position = BoqPosition(
        section_id=section.id,
        ordinal=payload.ordinal,
        description=payload.description,
        unit=payload.unit,
        quantity=payload.quantity,
        unit_rate=payload.unit_rate,
        sort_order=next_order,
    )
    db.add(position)
    _commit(db)
    db.refresh(position)
    return position


@router.patch("/positions/{position_id}", response_model=PositionRead)
def update_position(
    position_id: int,
    payload: PositionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    position = _owned_position(db, position_id, user)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(position, key, value)
    _commit(db)
    db.refresh(position)
    return position


@router.delete("/positions/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_position(
    position_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.delete(_owned_position(db, position_id, user))
    _commit(db)
@router.get("/boqs/{boq_id}/export")
def export_boq(
    boq_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    boq = _owned_boq(db, boq_id, user)
    return StreamingResponse(
        build_boq_xlsx(boq),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{export_filename(boq)}"'
        },
    )    