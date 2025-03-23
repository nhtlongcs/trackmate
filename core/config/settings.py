from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env.dev", ".env"))

    # Globals
    CACHE_DIR: str = ".cache"

    # Google
    GOOGLE_APPLICATION_CREDENTIALS: str = ""

    # LLM
    GEMINI_API_KEY: str = ""

    # PydanticAI
    LOGFIRE_TOKEN: str = ""
    PYDANTIC_AI_MODEL: str = ""


settings = Settings()
