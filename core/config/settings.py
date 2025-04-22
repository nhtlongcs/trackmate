from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env.dev", ".env"))

    # Globals
    CACHE_DIR: str = ".cache"
    DATA_DIR: str = "data"

    # Google
    GOOGLE_APPLICATION_CREDENTIALS: str = ""

    # LLM
    GEMINI_API_KEY: str = ""

    # Bot
    TELEGRAM_BOT_TOKEN: str = ""


settings = Settings()
