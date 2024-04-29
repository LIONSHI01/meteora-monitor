import {
  Keypair,
  Connection,
  PublicKey,
  ComputeBudgetProgram,
  KeyedAccountInfo,
  TransactionMessage,
  VersionedTransaction,
  sendAndConfirmTransaction,
  TokenAmount,
} from "@solana/web3.js";

import bs58 from "bs58";
import DLMM, {
  StrategyType,
  calculateSpotDistribution,
} from "@meteora-ag/dlmm";

import {
  COMMITMENT_LEVEL,
  PRIVATE_KEY,
  RPC_ENDPOINT,
  RPC_WEBSOCKET_ENDPOINT,
} from "./constants";
import { logger } from "./utils";

import { Wallet } from "@project-serum/anchor";
import { MeteoraDlmm, monitorPositions } from "./liquidity";

// Wallet to be monitor
const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY)));

const solanaConnection = new Connection(RPC_ENDPOINT, "finalized");

const SOL_USDC_POOL = new PublicKey(
  "CR2kQQcALb9FpA5y5KA7oa3Kf1kZ63Tz6uSQyG2yzPc6"
);

const Liquidity = new MeteoraDlmm(wallet);
async function main() {
  // const dlmmPool = await DLMM.create(solanaConnection, SOL_USDC_POOL);
  const positionsMap = await Liquidity.getAllLbPairPositions();
  let array = Array.from(positionsMap, ([name, value]) => ({
    positionAddress: name,
    position: value,
  }));

  // await Liquidity.createBalancePosition(dlmmPool, 1000000);
  // await monitorPositions(
  //   solanaConnection,
  //   "BmdTFuWX5QqsFdYe8554TV45TJbGGmcThDK6ArLFHemt",
  //   wallet
  // );
}

main();
