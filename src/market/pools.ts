import {
  METEORA_APP_DOMAIN,
  WATCHLIST_MIN_24H_FEES,
  WATCHLIST_MIN_24H_VOLUME,
  WATCHLIST_MIN_APR,
} from "../constants/constants";
import fs from "fs";
import { resolve } from "path";

import { getAllPairs } from "../api";
import { logger, parseNumber } from "../utils";

import { MIN_24H_FEES, MIN_APR, MIN_24H_VOLUME } from "../constants";
import { Pair } from "../utils/types";
import { getPoolMarket } from "../api/geckoterminal";
import { getPoolMarketStats } from "./gecko-market";
import { PairWithMarketData } from "../utils/types/gecko";
import _ from "lodash";

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
    return pool.name.toLowerCase().includes(token.toLocaleLowerCase()) && pool;
  }
}
const filterByVolume = (targetVol: number) => (pool: Pair) => {
  return Number(pool.trade_volume_24h) > targetVol && pool;
};
const filterByTxFee = (targetFee: number) => (pool: Pair) => {
  return Number(pool.fees_24h) > targetFee && pool;
};
const filterByApr = (targetApr: number) => (pool: Pair) => {
  return Number(pool.apr) > targetApr && pool;
};

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
  Fee per TVL(Today): ${parseNumber(fees_24h / Number(liquidity))} 
  Fee per TVL(24h): ${parseNumber(today_fees / Number(liquidity))} 
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
    .filter(filterByVolume(MIN_24H_VOLUME))
    .filter(filterByTxFee(MIN_24H_FEES))
    .filter(filterByApr(MIN_APR))
    .sort(sortByApr);

  const matchedPoolsWithMarketData = await Promise.all(
    matchedPools.map(addMarketData)
  );

  const finalOutput = matchedPoolsWithMarketData
    .map(generatePoolMessage)
    .join("\n\n");
  return finalOutput;
}

export async function getWatchListPools() {
  await init();

  let matchedPools = [];
  const allPools = await getAllPairs();
  for (const token of tokenList) {
    for (const pool of allPools) {
      if (pool.name.toLocaleLowerCase().includes(token)) {
        matchedPools.push(pool);
      }
    }
  }

  const filteredPools = allPools
    .filter(filterByVolume(WATCHLIST_MIN_24H_VOLUME))
    .filter(filterByTxFee(WATCHLIST_MIN_24H_FEES))
    .filter(filterByApr(WATCHLIST_MIN_APR))
    .sort(sortByApr);

  const uniqueFilPools = _.uniqBy(filteredPools, "name");

  const matchedPoolsWithMarketData = await Promise.all(
    uniqueFilPools.map(addMarketData)
  );
  console.log(
    "🚀 ~ getWatchListPools ~ matchedPoolsWithMarketData:",
    matchedPoolsWithMarketData
  );

  const finalOutput = matchedPoolsWithMarketData
    .map(generatePoolMessage)
    .join("\n\n");
  return finalOutput;
}
