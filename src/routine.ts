import { Connection } from "@solana/web3.js";
import { checkWalletPositionsInRange } from "./routine-works";
import { RPC_ENDPOINT, TELEGRAM_CHAT_ROOM_ID } from "./constants";
import { bot } from "./telegram";
import { logger } from "./utils";

const connection = new Connection(RPC_ENDPOINT, "finalized");

bot.launch();

async function init() {
  logger.info("Start Meteora Routine Monitor.");
  // bot.telegram.sendMessage(
  //   TELEGRAM_CHAT_ROOM_ID,
  //   "Start Meteora Routine Monitor."
  // );
}

async function runtRoutine() {
  await init();
  await checkWalletPositionsInRange(connection, bot);
}

checkWalletPositionsInRange(connection, bot);

setInterval(runtRoutine, 3 * 60 * 1000);
