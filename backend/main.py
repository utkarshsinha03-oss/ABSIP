"""
ABSIP / RAKSHAK — Backend API Server (Integrated)

Combines the Intelligence module (threat scoring) and the
Planning/DSA module (graph, ranking, patrol dispatch) into a
single FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from backend.routers import intelligence, planning , data , auth


app = FastAPI(title="RAKSHAK / ABSIP API", version="2.0.0")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if frontend_url and frontend_url not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intelligence.router)
app.include_router(planning.router)
app.include_router(data.router)
app.include_router(auth.router)

@app.get("/")
def root():
    return {"service": "RAKSHAK / ABSIP API", "status": "online"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "RAKSHAK / ABSIP API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
    