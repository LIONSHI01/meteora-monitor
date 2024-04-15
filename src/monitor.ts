import fs from "fs";
import { resolve } from "path";
import _ from "lodash";

import { Connection, PublicKey } from "@solana/web3.js";
import DLMM from "@meteora-ag/dlmm";
import { bot } from "./telegram";

import { logger } from "./utils";
import {
  RPC_ENDPOINT,
  RPC_WEBSOCKET_ENDPOINT,
  WALLET_ADDRESS,
  POOL_CHECK_TIME_INTERVAL,
  TELEGRAM_CHAT_ROOM_ID,
  COMMITMENT_LEVEL,
  METEORA_APP_DOMAIN,
} from "./constants";
import { getHighYieldPools } from "./market/pools";

let poolList: string[] = [];
let tokenList: string[] = [];

// NOTE: launch Telegram bot
bot.launch();

const poolListPath = resolve("./pool-list.txt");
const tokenListPath = resolve("./token-list.txt");

const solanaConnection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
  commitment: COMMITMENT_LEVEL,
  disableRetryOnRateLimit: true,
});

const user = new PublicKey(WALLET_ADDRESS);
logger.info(`Wallet Address: ${WALLET_ADDRESS}`);

function loadPoolList() {
  const count = poolList.length;
  const data = fs.readFileSync(poolListPath, "utf-8");
  poolList = data
    .split("\n")
    .map((a) => a.trim())
    .filter((a) => a);

  if (poolList.length != count) {
    logger.info(`Loaded pool list: ${poolList.length}`);
  }
}

function loadTokenList() {
  const count = tokenList.length;
  const data = fs.readFileSync(tokenListPath, "utf-8");
  tokenList = data
    .split("\n")
    .map((a) => a.trim().toLowerCase())
    .filter((a) => a);

  if (tokenList.length != count) {
    logger.info(`Loaded token list: ${tokenList.length}`);
  }
}

function addNewPoolAddress(poolAddress: string) {
  fs.appendFile(poolListPath, "\n" + poolAddress, (err) => {
    if (err) {
      console.error("Error appending to file:", err);
      return;
    }
  });
}

function runTgBot() {
  logger.info("------------------- 🚀 ---------------------");
  logger.info("Telegram bot started.");
  logger.info("------------------- 🚀 ---------------------");
  bot.telegram.sendMessage(TELEGRAM_CHAT_ROOM_ID, "Meteora Monitor start !");

  bot.command("check", (ctx) => {
    ctx.reply(`Checking Pools no.: ${poolList.length || 0} `);

    if (poolList.length > 0) {
      checkPools();
    }
  });

  bot.command("add", (ctx) => {
    const newPoolAddress = ctx.message.text.split(" ")[1];

    if (poolList.includes(newPoolAddress)) {
      ctx.reply(`Address: ${newPoolAddress} already exist on list.`);
      return;
    }

    // Append the new address to the file
    addNewPoolAddress(newPoolAddress);

    ctx.reply(`added new pool address: ${newPoolAddress}`);

    loadPoolList();
  });

  bot.command("info", (ctx) => {
    const allPoolLinks = poolList
      .map((pool) => `${METEORA_APP_DOMAIN}/${pool}`)
      .join("\n ------------ \n");

    const msgWithAllPools = `
  Your Pools:\n
  ${allPoolLinks}
  `;

    ctx.reply(msgWithAllPools);
  });

  bot.command("pools", async (ctx) => {
    const highYieldPools = await getHighYieldPools();
    ctx.reply(highYieldPools);
  });

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

async function init() {
  runTgBot();
  loadPoolList();
  loadTokenList();

  logger.info(`-------------------🟢------------------- `);
  logger.info("Initiating Bot...");
}

async function checkPools() {
  if (poolList.length === 0) return;

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
        const poolUrl = `${METEORA_APP_DOMAIN}/${poolAddress}`;
        const message = `
        Position is out of range!\n
        Link: ${poolUrl}
        `;

        bot.telegram.sendMessage(TELEGRAM_CHAT_ROOM_ID, message);
      }
    }
  }

  logger.info("Bot sleeping...");
}

async function runListener() {
  await init();
  checkPools();
  setInterval(checkPools, POOL_CHECK_TIME_INTERVAL);
}

runListener();