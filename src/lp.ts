import {
  Keypair,
  Connection,
  PublicKey,
  ComputeBudgetProgram,
  KeyedAccountInfo,
  TransactionMessage,
  VersionedTransaction,
  sendAndConfirmTransaction,
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
import BN from "bn.js";
import { MeteoraDlmm } from "./liquidity";

let wallet: Keypair;

wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

const solanaConnection = new Connection(RPC_ENDPOINT, "finalized");

const USDC_USDT_POOL = new PublicKey(
  "BmdTFuWX5QqsFdYe8554TV45TJbGGmcThDK6ArLFHemt"
);

async function main() {
  monitorPosition();
}

async function monitorPosition() {
  const dlmmPool = await DLMM.create(solanaConnection, USDC_USDT_POOL);
  const LiquidityProvider = new MeteoraDlmm(dlmmPool);
  // await LiquidityProvider.createBalancePosition(dlmmPool, 2 * 10 ** 6);
}

// async function main() {
//   const dlmmPool = await DLMM.create(solanaConnection, USDC_USDT_POOL);
//   const activeBin = await dlmmPool.getActiveBin();
//   // const activeBinPriceLamport = activeBin.price;

//   const TOTAL_RANGE_INTERVAL = 20; // 10 bins on each side of the active bin
//   const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
//   const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

//   const activeBinPricePerToken = dlmmPool.fromPricePerLamport(
//     Number(activeBin.price)
//   );
//   const totalXAmount = new BN(2 * 10 ** 6);
//   const totalYAmount = totalXAmount.mul(new BN(Number(activeBinPricePerToken)));

//   const newBalancePosition = new Keypair();
//   // Create Position (Spot Balance deposit, Please refer ``example.ts` for more example)
//   logger.info("create Tx Position");

//   const createPositionTx =
//     await dlmmPool.initializePositionAndAddLiquidityByStrategy({
//       positionPubKey: newBalancePosition.publicKey,
//       user: wallet.publicKey,
//       totalXAmount,
//       totalYAmount,
//       strategy: {
//         maxBinId,
//         minBinId,
//         strategyType: StrategyType.SpotBalanced,
//       },
//       slippage: 5,
//     });

//   logger.info("createPositionTx");
//   try {
//     logger.info("Sending Tx...");
//     const createBalancePositionTxHash = await sendAndConfirmTransaction(
//       solanaConnection,
//       createPositionTx,
//       [wallet, newBalancePosition]
//     );

//     logger.info("Finish Tx.");
//     console.log(createBalancePositionTxHash);
//   } catch (error) {
//     console.log(error);
//   }
// }

main();
