import { Telegraf } from "telegraf";

import { TELEGRAM_BOT_TOKEN } from "../constants";

export const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
