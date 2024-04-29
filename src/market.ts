import fs from "fs";
import { resolve } from "path";
import _ from "lodash";
import { Markup } from "telegraf";
import { Connection, PublicKey } from "@solana/web3.js";
import DLMM from "@meteora-ag/dlmm";

import { bot, tgMessageReporter } from "./telegram";
import { delay, logger } from "./utils";
import {
  RPC_ENDPOINT,
  RPC_WEBSOCKET_ENDPOINT,
  WALLET_ADDRESS,
  TELEGRAM_CHAT_ROOM_ID,
  COMMITMENT_LEVEL,
  METEORA_APP_DOMAIN,
  POOL_CHECK_TIME_INTERVAL,
} from "./constants";
import {
  generatePoolMessage,
  getHighYieldPools,
  getPoolAnalysis,
  getWatchListPools,
  huntHighYieldPools,
} from "./market/pools";
import { PairWithMarketData } from "./utils/types/gecko";

let poolList: string[] = [];
let tokenList: string[] = [];
let HIGH_YIELD_POOLS: PairWithMarketData[] = [];

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
  // bot.use(Telegraf.log());
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

  bot.command("pool", async (ctx) => {
    const poolToCheck = ctx.message.text.split(" ")[1];

    if (!poolToCheck) return;

    const poolAnalysisReport = await getPoolAnalysis(poolToCheck);
    ctx.reply(poolAnalysisReport);
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
    logger.info("Asking for High Yield pools");
    const highYieldPools = await getHighYieldPools();
    for (const poolMsg of highYieldPools) {
      ctx.reply(poolMsg);
      await delay(1000);
    }
  });

  bot.command("list", async (ctx) => {
    logger.info("Asking for Watch List pools");
    const watchListPools = await getWatchListPools();
    for (const poolMsg of watchListPools) {
      ctx.reply(poolMsg);
      await delay(1000);
    }
  });

  // Keyboard

  bot.command("a", async (ctx) => {
    const keyboard = Markup.inlineKeyboard([
      Markup.button.callback("Pools", "pools"),
      Markup.button.callback("Watchlist", "watchlist"),
      Markup.button.callback("High Yields", "highyield"),
    ]);

    await ctx.reply("Choose an option:", keyboard);
  });

  bot.action("pools", async (ctx) => {
    logger.info("Asking for High Yield pools");

    ctx.answerCbQuery("Checking for High Yield pools");
    ctx.reply("Checking for High Yield pools");
    const highYieldPools = await getHighYieldPools();
    for (const poolMsg of highYieldPools) {
      ctx.reply(poolMsg);
      await delay(1000);
    }
    ctx.reply("===That's all High Yield pools===");
  });

  bot.action("watchlist", async (ctx) => {
    logger.info("Asking for Watch List pools");

    ctx.answerCbQuery("Checking for Watch List pools");
    ctx.reply("Checking for Watch List pools");
    const watchListPools = await getWatchListPools();
    for (const poolMsg of watchListPools) {
      ctx.reply(poolMsg);
      await delay(1000);
    }
    ctx.reply("===That's all Watch List pools===");
  });

  bot.action("highyield", async (ctx) => {
    logger.info("Asking for High Yield pools");

    ctx.answerCbQuery("Checking for High Yield pools");
    ctx.reply("Checking for High Yield pools");

    await highYieldCheck();
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
        await delay(1000);
      }
    }
  }

  logger.info("Bot sleeping...");
}

async function highYieldCheck() {
  const highYieldPools = await huntHighYieldPools();
  // Check if already spotted
  const newPools = highYieldPools.filter((existingPool) => {
    return !HIGH_YIELD_POOLS.find(
      (pool) => pool.address === existingPool.address
    );
  });

  HIGH_YIELD_POOLS.push(...newPools);

  const poolMessages = newPools.map(generatePoolMessage);

  if (newPools.length > 0) {
    logger.info(`Spotted HIGH YIELD POOLS: ${newPools.length}`);
    bot.telegram.sendMessage(
      TELEGRAM_CHAT_ROOM_ID,
      `Spotted HIGH YIELD POOLS: ${newPools.length}`
    );

    await tgMessageReporter({
      chatId: TELEGRAM_CHAT_ROOM_ID,
      poolMessages,
      endMsg: "===That's all HIGH YIELD POOLS===",
    });
  }
}

let intervalId: NodeJS.Timeout;
async function runMarketListener() {
  await init();
  intervalId = setInterval(highYieldCheck, POOL_CHECK_TIME_INTERVAL);
}

function terminateMarketListener() {
  clearInterval(intervalId); // Clear the interval
  console.log("Market listener terminated.");
}

runMarketListener();

terminateMarketListener();
