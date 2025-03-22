from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

from config.settings import settings


def auth_google_installed_app_flow(scopes: list[str]):
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    cache_dir = Path(settings.CACHE_DIR)
    cache_dir.mkdir(exist_ok=True)

    token_cache = cache_dir / "token.json"

    if token_cache.exists():
        creds = Credentials.from_authorized_user_file(str(token_cache), scopes)

    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                settings.GOOGLE_APPLICATION_CREDENTIALS, scopes
            )
            creds = flow.run_local_server(port=8080)
        # Save the credentials for the next run
        with open(token_cache, "w") as token:
            token.write(creds.to_json())
    return creds
