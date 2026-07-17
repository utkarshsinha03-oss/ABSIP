from fastapi import APIRouter
import json
from pathlib import Path

router = APIRouter(tags=["Data"])

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


def load_json(filename):
    with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/sensors")
def get_sensors():
    return load_json("sensors.json")


@router.get("/incidents")
def get_incidents():
    return load_json("incidents.json")


@router.get("/patrols")
def get_patrols():
    return load_json("patrols.json")


@router.get("/patrol-logs")
def get_patrol_logs():
    return load_json("patrol_logs.json")