from aiogram import Bot, Dispatcher, types
from aiogram.types import WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.utils import executor

bot = Bot("YOUR_BOT_TOKEN")
dp = Dispatcher(bot)

@dp.message_handler(commands=['start'])
async def start(message: types.Message):
    keyboard = InlineKeyboardMarkup()
    webapp_button = InlineKeyboardButton(
        text="Открыть магазин",
        web_app=WebAppInfo(url="https://your-domain.com/")
    )
    keyboard.add(webapp_button)
    await message.answer("Добро пожаловать 👋", reply_markup=keyboard)

if __name__ == "__main__":
    executor.start_polling(dp)
