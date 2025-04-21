# Core Module

This module is part of the Trackmate project and provides essential functionalities for data processing and management.

1. **API Tokens**: 
   - Obtain your token from [Logfire](https://logfire.pydantic.dev/).
   - Get your Gemini API key from [AI Studio](https://aistudio.google.com/app/apikey).
   - Get your Llama Cloud API key from [Llama Cloud](https://cloud.llamaindex.ai/).

2. **Environment Configuration**:
   - Ensure your environment variables are set up correctly by configuring the `.env` files.


# Run

This package provide two ways for interactions:

1. CLI
2. Telegram

**Important**:
- When you run the app for the first time (either CLI or telegram), you need to login with your google account.
- The app can only access the google sheet files **in your Google Drive**.

## CLI

```
cd core/
python -m cli.chat --help
```

After starting the application, you can interact with it. Please have a look at [chat.py](./cli/chat.py) for more CLI arguments

## Telegram

```
cd core/
python -m cli.telegram
```

After starting the bot, please open telegram chat app and find @trackmateaibot. Click `/start` and you can interact with it.
