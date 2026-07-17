"""
ABSIP / RAKSHAK — Backend API Server (Integrated)

Combines the Intelligence module (threat scoring) and the
Planning/DSA module (graph, ranking, patrol dispatch) into a
single FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import intelligence, planning , data


app = FastAPI(title="RAKSHAK / ABSIP API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intelligence.router)
app.include_router(planning.router)
app.include_router(data.router)

@app.get("/")
def root():
    return {"service": "RAKSHAK / ABSIP API", "status": "online"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "RAKSHAK / ABSIP API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
    