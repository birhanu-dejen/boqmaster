from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import projects
from app.core.config import settings
from app.routers import auth

app = FastAPI(title="BOQMaster API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
from fastapi.middleware.cors import CORSMiddleware


@app.get("/health")
def health():
    return {"status": "ok"}