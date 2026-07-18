from fastapi import APIRouter
from sqlalchemy import select

from backend.db import SessionLocal
from backend.models import Sensor, Incident, Patrol, PatrolLog

router = APIRouter(tags=["Data"])


@router.get("/sensors")
def get_sensors():
    db = SessionLocal()
    data = db.execute(select(Sensor)).scalars().all()
    db.close()
    return data


@router.get("/incidents")
def get_incidents():
    db = SessionLocal()
    data = db.execute(select(Incident)).scalars().all()
    db.close()
    return data


@router.get("/patrols")
def get_patrols():
    db = SessionLocal()
    data = db.execute(select(Patrol)).scalars().all()
    db.close()
    return data


@router.get("/patrol-logs")
def get_patrol_logs():
    db = SessionLocal()
    data = db.execute(select(PatrolLog)).scalars().all()
    db.close()
    return data