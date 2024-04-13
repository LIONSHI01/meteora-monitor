import fs from "fs";
import { resolve } from "path";
import _ from "lodash";

import { Connection, PublicKey } from "@solana/web3.js";
import DLMM from "@meteora-ag/dlmm";
import { bot } from "./telegram";

// import { getAccountEarnings } from "./account/account";
import { delay, logger } from "./utils";
import {
  RPC_ENDPOINT,
  RPC_WEBSOCKET_ENDPOINT,
  WALLET_ADDRESS,
  POOL_CHECK_TIME_INTERVAL,
  TELEGRAM_CHAT_ROOM_ID,
  COMMITMENT_LEVEL,
} from "./constants";

let poolList: string[] = [];

const solanaConnection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
  commitment: COMMITMENT_LEVEL,
  disableRetryOnRateLimit: true,
});
const user = new PublicKey(WALLET_ADDRESS);
logger.info(`Wallet Address: ${WALLET_ADDRESS}`);

function loadPoolList() {
  const count = poolList.length;
  const data = fs.readFileSync(resolve("./pool-list.txt"), "utf-8");
  poolList = data
    .split("\n")
    .map((a) => a.trim())
    .filter((a) => a);

  if (poolList.length != count) {
    logger.info(`Loaded pool list: ${poolList.length}`);
  }
}

function runTgBot() {
  bot.launch();
  logger.info("------------------- 🚀 ---------------------");
  logger.info("Telegram bot started.");
  logger.info("------------------- 🚀 ---------------------");
  bot.telegram.sendMessage(TELEGRAM_CHAT_ROOM_ID, "Meteora Monitor start !");

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

async function init() {
  loadPoolList();
  runTgBot();
}

async function checkPools() {
  logger.info(`-------------------🟢------------------- `);
  logger.info("Checking pools...");

  for (const poolAddress of poolList) {
    const Pool = new PublicKey(poolAddress);
    const dlmmPool = await DLMM.create(solanaConnection, Pool);
    const { userPositions, activeBin } =
      await dlmmPool.getPositionsByUserAndLbPair(user);

    for (const position of userPositions) {
      const { lowerBinId, upperBinId } = position.positionData;
      const isPositionWithinRange = _.inRange(
        activeBin.binId,
        lowerBinId,
        upperBinId
      );
      if (isPositionWithinRange) {
        logger.info("Pool is within range.");
      }

      if (!isPositionWithinRange) {
        const message = `Position is out of range!`;
        bot.telegram.sendMessage(TELEGRAM_CHAT_ROOM_ID, message);
      }
    }

    logger.info("Bot sleeping...");
    await delay(1000);
  }
}

async function runListener() {
  await init();
  checkPools();
  setInterval(checkPools, POOL_CHECK_TIME_INTERVAL);
}

runListener();
