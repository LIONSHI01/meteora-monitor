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
import { monitorPositions } from "./liquidity";

// Wallet to be monitor
const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY)));

const solanaConnection = new Connection(RPC_ENDPOINT, "finalized");

const USDC_USDT_POOL = new PublicKey(
  "BmdTFuWX5QqsFdYe8554TV45TJbGGmcThDK6ArLFHemt"
);
const SOL_USDC_POOL = new PublicKey(
  "4YVLUZGEhsjfsWuxRbo6h18vL297HYRHTrLVE8bwpyCW"
);

async function main() {
  await monitorPositions(
    solanaConnection,
    "4YVLUZGEhsjfsWuxRbo6h18vL297HYRHTrLVE8bwpyCW",
    wallet
  );
}

main();
