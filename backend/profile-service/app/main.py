from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.profiles_auth import router

app = FastAPI(title="Profile Service")

# CORS (чтобы React мог стучаться)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Для разработки можно всё
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/profiles/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(router)