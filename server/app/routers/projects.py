from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.boq import Boq
from app.models.project import Project
from app.models.user import User
from app.schemas.boq import BoqCreate, BoqRead
from app.schemas.project import ProjectCreate, ProjectRead

router = APIRouter(prefix="/projects", tags=["projects"])


def _get_owned_project(db: Session, project_id: int, user: User) -> Project:
    project = db.get(Project, project_id)
    if not project or project.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(
        name=payload.name,
        client_name=payload.client,
        location=payload.location,
        description=payload.description or None,
        owner_id=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=list[ProjectRead])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Project)
        .where(Project.owner_id == current_user.id)
        .order_by(Project.created_at.desc())
    )
    return db.scalars(stmt).all()


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_owned_project(db, project_id, current_user)


@router.get("/{project_id}/boqs", response_model=list[BoqRead])
def list_boqs(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_project(db, project_id, current_user)
    stmt = (
        select(Boq)
        .where(Boq.project_id == project_id)
        .order_by(Boq.created_at.desc())
    )
    return db.scalars(stmt).all()


@router.post(
    "/{project_id}/boqs",
    response_model=BoqRead,
    status_code=status.HTTP_201_CREATED,
)
def create_boq(
    project_id: int,
    payload: BoqCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_project(db, project_id, current_user)
    boq = Boq(
        project_id=project_id,
        name=payload.name,
        description=payload.description or None,
    )
    db.add(boq)
    db.commit()
    db.refresh(boq)
    return boq