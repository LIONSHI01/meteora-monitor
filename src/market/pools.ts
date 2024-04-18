import { METEORA_APP_DOMAIN } from "../constants/constants";
import fs from "fs";
import { resolve } from "path";

import { getAllPairs } from "../api";
import { logger } from "../utils";

import { MIN_24H_FEES, MIN_APR, MIN_24H_VOLUME } from "../constants";
import { Pair } from "../utils/types";

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

const sortByApr = (a: Pair, b: Pair) => b.apr - a.apr;

function generatePoolMessage(pool: Pair) {
  const { address, apr, fees_24h, today_fees, liquidity, name } = pool || {};
  const poolUrl = `${METEORA_APP_DOMAIN}/${address}`;
  const feePerTvl24H =
    Math.ceil((Number(fees_24h) / Number(liquidity)) * 100) / 100;
  const feePerTvlToday =
    Math.ceil(Number(today_fees) / Number(liquidity)) / 100;
  const outputMsg = `
  Pair: ${name} 
  Apr: ${apr.toFixed(2)}% 
  24h fees: ${fees_24h.toFixed(2)} 
  Today fees: ${today_fees.toFixed(2)} 
  TVL: ${Number(liquidity).toFixed(2)} 
  Fee per TVL(Today): ${feePerTvl24H} 
  Fee per TVL(24h): ${feePerTvlToday} 
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

  const finalOutput = matchedPools.map(generatePoolMessage).join("\n\n\n");
  return finalOutput;
}
