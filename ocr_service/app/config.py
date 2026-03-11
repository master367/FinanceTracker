import sys
from pydantic_settings import BaseSettings, SettingsConfigDict

_PLACEHOLDER = "INSERT_YOUR_GEMINI_API_KEY_HERE"

_HELP_MESSAGE = """
================================================================================
CRITICAL ERROR: GEMINI_API_KEY is missing or invalid.
Please get your free API key at https://aistudio.google.com/app/apikey,
create a .env file in the ocr_service directory, and add your key:

    GEMINI_API_KEY=your_actual_key_here

================================================================================
"""


class Settings(BaseSettings):
    gemini_api_key: str = ""

    model_config = SettingsConfigDict(
        env_file="../.env",  # when running locally outside docker
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def validate_key(self) -> None:
        """Call this at app startup to exit early with a clear message if the key is bad."""
        key = self.gemini_api_key.strip()
        if not key or key == _PLACEHOLDER:
            print(_HELP_MESSAGE, file=sys.stderr, flush=True)
            sys.exit(1)


settings = Settings()
settings.validate_key()
