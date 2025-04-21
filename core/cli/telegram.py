from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CallbackContext,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes,
)

from config.logger import logger
from config.settings import settings
from services.sheets import GoogleSheetService

google_sheet = GoogleSheetService()


async def start_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Welcome to my awesome bot!")


async def sheet_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handling /sheet command

    Examples:
    >>> /sheet https://docs.google.com/spreadsheets/d/1l6tE-VfONOKlHoOsGops7pW_GBca1Yzj5wsTHpiqDwg
    >>> /sheet https://docs.google.com/spreadsheets/d/1l6tE-VfONOKlHoOsGops7pW_GBca1Yzj5wsTHpiqDwg/edit?gid=1623561206#gid=1623561206
    """
    logger.info("Sheet callback: %s", update)
    splits = list(filter(lambda x: x, update.message.text.split(" ")))
    if len(splits) != 2:
        await update.message.reply_markdown_v2("""
*Invalid command usage*
                                               
*Usage:*
```                              
/sheet <google_sheet_url>
```
""")
        return

    url = splits[1].strip()
    sheet_id = google_sheet.get_sheet_id_from_url(url)
    if sheet_id is None:
        await update.message.reply_markdown_v2("""*Invalid sheet url*""")
        return

    file_name = google_sheet.read_sheet_filename(sheet_id)
    await update.message.reply_markdown_v2(
        f"""Configured bot to use spreadsheet: *{file_name}*"""
    )


async def message_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logger.debug(
        "%s", update
    )  # Need to config loglevel in config.logger to logging.DEBUG
    # Update(message=Message(channel_chat_created=False, chat=Chat(first_name='Loi', id=1464530880,
    # last_name='Ly', type=<ChatType.PRIVATE>), date=datetime.datetime(2025, 3, 29, 0, 8, 37,
    # tzinfo=datetime.timezone.utc), delete_chat_photo=False, from_user=User(first_name='Loi',
    # id=1464530880, is_bot=False, language_code='en', last_name='Ly'),
    # group_chat_created=False, message_id=37, supergroup_chat_created=False, text='aaa'), update_id=58150014)

    logger.info(
        "%s wrote: %s",
        update.message.from_user.first_name,
        update.message.text,
    )

    # if update.message.photo:
    #     await context.bot.send_message(
    #         update.message.chat_id,
    #         "Processing...",
    #         # To preserve the markdown, we attach entities (bold, italic...)
    #         entities=update.message.entities,
    #     )

    #     for i, photo in enumerate(update.message.photo, 1):
    #         file = await photo.get_file()
    #         downloaded_path = await file.download_to_drive()
    #         print(f"{i:02d}", str(downloaded_path))

    # if update.message.text:
    #     # Reply with upper case
    #     await context.bot.send_message(
    #         update.message.chat_id,
    #         update.message.text.upper(),
    #         # To preserve the markdown, we attach entities (bold, italic...)
    #         entities=update.message.entities,
    #     )


def create_bot():
    logger.info("Creating bot")
    bot = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).build()
    bot.add_handler(CommandHandler("start", start_callback))
    bot.add_handler(CommandHandler("sheet", sheet_callback))
    bot.add_handler(MessageHandler(~filters.COMMAND, message_callback))
    return bot


# run normal
def main():
    bot = create_bot()

    logger.info("Listening for updates...")
    bot.run_polling()
    logger.info("Shutdown")


if __name__ == "__main__":
    main()

# # run with asyncio
# async def main():
#     bot = create_bot()
#     await bot.initialize()
#     await bot.start()
#     await bot.updater.start_polling()
#     # Start other asyncio frameworks here
#     # Add some logic that keeps the event loop running until you want to shutdown
#     # Stop the other asyncio frameworks here
#     await bot.updater.stop()
#     await bot.stop()
#     await bot.shutdown()


# if __name__ == "__main__":
#     asyncio.run(main())
