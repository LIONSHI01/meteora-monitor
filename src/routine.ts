import { Connection } from "@solana/web3.js";
import { checkWalletPositionsInRange } from "./routine-works";
import { RPC_ENDPOINT, TELEGRAM_CHAT_ROOM_ID } from "./constants";
import { bot } from "./telegram";

const connection = new Connection(RPC_ENDPOINT, "finalized");

bot.launch();

async function init() {
  bot.telegram.sendMessage(
    TELEGRAM_CHAT_ROOM_ID,
    "Start Meteora Routine Monitor."
  );
}

async function runtRoutine() {
  init();
  await checkWalletPositionsInRange(connection, bot);
}

setTimeout(runtRoutine, 10 * 60 * 1000);
