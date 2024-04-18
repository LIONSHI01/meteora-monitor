import { METEORA_APP_DOMAIN } from "../constants/constants";
import fs from "fs";
import { resolve } from "path";

import { getAllPairs } from "../api";
import { logger, parseNumber } from "../utils";

import { MIN_24H_FEES, MIN_APR, MIN_24H_VOLUME } from "../constants";
import { Pair } from "../utils/types";
import { getPoolMarket } from "../api/geckoterminal";
import { getPoolMarketStats } from "./gecko-market";
import { PairWithMarketData } from "../utils/types/gecko";

/**
 * Target:
 * 1) high tx volume
 * 2) high apr
 * 3) high yield in USD
 *
 * Requirements:
 * 1) min 24h fees
 * 2) min_volume
 *
 *
 *
 * Output:
 * 1) Pool Link
 * 2) Pair name
 * 3) yield per 1 dollar (today)
 * 4) yield per 1 dollar (24h)
 * */

let tokenList: string[] = [];

const tokenListPath = resolve("./token-list.txt");

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

function filterByName(pool: Pair) {
  for (const token of tokenList) {
    return pool.name.toLowerCase().includes(token) && pool;
  }
}
function filterByVolume(pool: Pair) {
  return Number(pool.trade_volume_24h) > MIN_24H_VOLUME && pool;
}
function filterByTxFee(pool: Pair) {
  return Number(pool.fees_24h) > MIN_24H_FEES && pool;
}
function filterByApr(pool: Pair) {
  return Number(pool.apr) > MIN_APR && pool;
}

async function addMarketData(pool: Pair): Promise<PairWithMarketData> {
  const poolMarketStats = await getPoolMarketStats(pool.address);
  const updatedPoolData = Object.assign(pool, poolMarketStats);
  return updatedPoolData;
}

const sortByApr = (a: Pair, b: Pair) => b.apr - a.apr;

function generatePoolMessage(pool: PairWithMarketData) {
  const {
    address,
    apr,
    fees_24h,
    today_fees,
    liquidity,
    name,
    priceM5,
    priceH1,
    priceH6,
    priceH24,
    txM15,
    txM30,
    txM5,
    volM5,
    volH1,
    volH24,
    volH6,
  } = pool || {};

  const poolUrl = `${METEORA_APP_DOMAIN}/${address}`;
  const outputMsg = `
  Pair: ${name} 
  Apr: ${parseNumber(apr)}% 
  24h fees: ${parseNumber(fees_24h)} 
  Today fees: ${parseNumber(today_fees)} 
  TVL: ${parseNumber(liquidity)} 
  Fee per TVL(Today): ${parseNumber(fees_24h)} 
  Fee per TVL(24h): ${parseNumber(today_fees)} 
  Price: 5M ${priceM5}|1H ${priceH1}|6H ${priceH6}|24H ${priceH24}
  Volume: 5M ${parseNumber(volM5)}|1H ${parseNumber(volH1)}|6H ${parseNumber(
    volH6
  )}|24H ${parseNumber(volH24)}
  ${poolUrl}
  `;

  return outputMsg;
}

async function init() {
  loadTokenList();
}

export async function getHighYieldPools() {
  await init();

  const allPools = await getAllPairs();
  const matchedPools = allPools
    .filter(filterByVolume)
    .filter(filterByTxFee)
    .filter(filterByApr)
    .sort(sortByApr);

  const matchedPoolsWithMarketData = await Promise.all(
    matchedPools.map(addMarketData)
  );

  const finalOutput = matchedPoolsWithMarketData
    .map(generatePoolMessage)
    .join("\n\n");
  return finalOutput;
}
