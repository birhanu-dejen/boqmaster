from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = "http://localhost:3000"
    COOKIE_SECURE: bool = False  # set True in production (HTTPS)
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()