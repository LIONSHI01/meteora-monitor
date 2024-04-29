import { Telegraf } from "telegraf";

import { TELEGRAM_BOT_TOKEN } from "../constants";
import { delay } from "../utils";

export const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

type ReporterParams = {
  chatId: number;
  poolMessages: string[];
  startMsg?: string;
  endMsg?: string;
};

export const tgMessageReporter = async ({
  chatId,
  poolMessages,
  endMsg,
  startMsg,
}: ReporterParams) => {
  startMsg && bot.telegram.sendMessage(chatId, startMsg);

  for (const poolMsg of poolMessages) {
    bot.telegram.sendMessage(chatId, poolMsg);
    await delay(1000);
  }

  endMsg && bot.telegram.sendMessage(chatId, endMsg);
};
