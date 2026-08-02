from fastapi import APIRouter, Depends
from backend.auth.dependency import get_current_user
from backend.models import User
from sqlalchemy import select

from backend.db import SessionLocal
from backend.models import Sensor, Incident, Patrol, PatrolLog

router = APIRouter(tags=["Data"])


@router.get("/sensors")
def get_sensors(
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()
    data = db.execute(select(Sensor)).scalars().all()
    db.close()
    return data


@router.get("/incidents")
def get_incidents(
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()
    data = db.execute(select(Incident)).scalars().all()
    db.close()
    return data


@router.get("/patrols")
def get_patrols(
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()
    data = db.execute(select(Patrol)).scalars().all()
    db.close()
    return data


@router.get("/patrol-logs")
def get_patrol_logs(
    current_user: User = Depends(get_current_user)
):
    db = SessionLocal()
    data = db.execute(select(PatrolLog)).scalars().all()
    db.close()
    return data