import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SYSVAR_CLOCK_PUBKEY,
  ParsedAccountData,
} from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import BN from "bn.js";
import DLMM, { BinLiquidity, LbPosition, StrategyType } from "@meteora-ag/dlmm";
import { logger } from "../utils";
import { PRIVATE_KEY, RPC_ENDPOINT } from "../constants";

const user = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

const connection = new Connection(RPC_ENDPOINT, "finalized");

// const devnetPool = new PublicKey(
//   "3W2HKgUa96Z69zzG3LK1g8KdcRAWzAttiLiHfYnKuPw5"
// );

/** Utils */
export interface ParsedClockState {
  info: {
    epoch: number;
    epochStartTimestamp: number;
    leaderScheduleEpoch: number;
    slot: number;
    unixTimestamp: number;
  };
  type: string;
  program: string;
  space: number;
}

// let activeBin: BinLiquidity;
// let userPositions: LbPosition[] = [];

// const newBalancePosition = new Keypair();
// const newImbalancePosition = new Keypair();
// const newOneSidePosition = new Keypair();

export class MeteoraDlmm {
  constructor() {}

  async getActiveBin(dlmmPool: DLMM) {
    // Get pool state
    logger.info("Get active bin");
    const activeBin = await dlmmPool.getActiveBin();
    return activeBin;
  }

  async createBalancePosition(dlmmPool: DLMM, tokenXAmount: number) {
    const newBalancePosition = new Keypair();
    const activeBin = await this.getActiveBin(dlmmPool);

    logger.info("Create LP Position");
    const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
    const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
    const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

    const activeBinPricePerToken = dlmmPool.fromPricePerLamport(
      Number(activeBin.price)
    );
    const totalXAmount = new BN(tokenXAmount);
    const totalYAmount = totalXAmount.mul(
      new BN(Number(activeBinPricePerToken))
    );

    logger.info("Create Position Tx");
    // Create Position
    const createPositionTx =
      await dlmmPool.initializePositionAndAddLiquidityByStrategy({
        positionPubKey: newBalancePosition.publicKey,
        user: user.publicKey,
        totalXAmount,
        totalYAmount,
        strategy: {
          maxBinId,
          minBinId,
          strategyType: StrategyType.SpotBalanced,
        },
      });

    try {
      logger.info("Sending Tx...");
      const createBalancePositionTxHash = await sendAndConfirmTransaction(
        connection,
        createPositionTx,
        [user, newBalancePosition]
      );
      console.log(
        "🚀 ~ createBalancePositionTxHash:",
        createBalancePositionTxHash
      );
      logger.info("Tx Confirmed");
    } catch (error) {
      console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
    }
  }

  // async createImbalancePosition(dlmmPool: DLMM) {
  //   const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
  //   const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
  //   const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

  //   const totalXAmount = new BN(100);
  //   const totalYAmount = new BN(50);

  //   // Create Position
  //   const createPositionTx =
  //     await dlmmPool.initializePositionAndAddLiquidityByStrategy({
  //       positionPubKey: newImbalancePosition.publicKey,
  //       user: user.publicKey,
  //       totalXAmount,
  //       totalYAmount,
  //       strategy: {
  //         maxBinId,
  //         minBinId,
  //         strategyType: StrategyType.SpotImBalanced,
  //       },
  //     });

  //   try {
  //     const createImbalancePositionTxHash = await sendAndConfirmTransaction(
  //       connection,
  //       createPositionTx,
  //       [user, newImbalancePosition]
  //     );
  //     console.log(
  //       "🚀 ~ createImbalancePositionTxHash:",
  //       createImbalancePositionTxHash
  //     );
  //   } catch (error) {
  //     console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
  //   }
  // }

  // async createOneSidePosition(dlmmPool: DLMM) {
  //   const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
  //   const minBinId = activeBin.binId;
  //   const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL * 2;

  //   const totalXAmount = new BN(100);
  //   const totalYAmount = new BN(0);

  //   // Create Position
  //   const createPositionTx =
  //     await dlmmPool.initializePositionAndAddLiquidityByStrategy({
  //       positionPubKey: newOneSidePosition.publicKey,
  //       user: user.publicKey,
  //       totalXAmount,
  //       totalYAmount,
  //       strategy: {
  //         maxBinId,
  //         minBinId,
  //         strategyType: StrategyType.SpotOneSide,
  //       },
  //     });

  //   try {
  //     const createOneSidePositionTxHash = await sendAndConfirmTransaction(
  //       connection,
  //       createPositionTx,
  //       [user, newOneSidePosition]
  //     );
  //     console.log(
  //       "🚀 ~ createOneSidePositionTxHash:",
  //       createOneSidePositionTxHash
  //     );
  //   } catch (error) {
  //     console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
  //   }
  // }

  // async getPositionsState(dlmmPool: DLMM) {
  //   // Get position state
  //   const positionsState = await dlmmPool.getPositionsByUserAndLbPair(
  //     user.publicKey
  //   );

  //   userPositions = positionsState.userPositions;
  //   console.log("🚀 ~ userPositions:", userPositions);
  // }

  // async addLiquidityToExistingPosition(dlmmPool: DLMM) {
  //   const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
  //   const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
  //   const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

  //   const activeBinPricePerToken = dlmmPool.fromPricePerLamport(
  //     Number(activeBin.price)
  //   );
  //   const totalXAmount = new BN(100);
  //   const totalYAmount = totalXAmount.mul(
  //     new BN(Number(activeBinPricePerToken))
  //   );

  //   // Add Liquidity to existing position
  //   const addLiquidityTx = await dlmmPool.addLiquidityByStrategy({
  //     positionPubKey: newBalancePosition.publicKey,
  //     user: user.publicKey,
  //     totalXAmount,
  //     totalYAmount,
  //     strategy: {
  //       maxBinId,
  //       minBinId,
  //       strategyType: StrategyType.SpotBalanced,
  //     },
  //   });

  //   try {
  //     const addLiquidityTxHash = await sendAndConfirmTransaction(
  //       connection,
  //       addLiquidityTx,
  //       [user]
  //     );
  //     console.log("🚀 ~ addLiquidityTxHash:", addLiquidityTxHash);
  //   } catch (error) {
  //     console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
  //   }
  // }

  // async removePositionLiquidity(dlmmPool: DLMM) {
  //   // Remove Liquidity
  //   const removeLiquidityTxs = (
  //     await Promise.all(
  //       userPositions.map(({ publicKey, positionData }) => {
  //         const binIdsToRemove = positionData.positionBinData.map(
  //           (bin) => bin.binId
  //         );
  //         return dlmmPool.removeLiquidity({
  //           position: publicKey,
  //           user: user.publicKey,
  //           binIds: binIdsToRemove,
  //           liquiditiesBpsToRemove: new Array(binIdsToRemove.length).fill(
  //             new BN(100 * 100)
  //           ),
  //           shouldClaimAndClose: true, // should claim swap fee and close position together
  //         });
  //       })
  //     )
  //   ).flat();

  //   try {
  //     for (let tx of removeLiquidityTxs) {
  //       const removeBalanceLiquidityTxHash = await sendAndConfirmTransaction(
  //         connection,
  //         tx,
  //         [user],
  //         { skipPreflight: false, preflightCommitment: "confirmed" }
  //       );
  //       console.log(
  //         "🚀 ~ removeBalanceLiquidityTxHash:",
  //         removeBalanceLiquidityTxHash
  //       );
  //     }
  //   } catch (error) {
  //     console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
  //   }
  // }

  // async swap(dlmmPool: DLMM) {
  //   const swapAmount = new BN(100);
  //   // Swap quote
  //   const swapYtoX = true;
  //   const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);

  //   // check whether it is permission or permissionless pool
  //   let maxSwappedAmount: BN;
  //   let throttledStats: boolean;
  //   if (!swapYtoX && dlmmPool.lbPair.pairType == 1) {
  //     // get current slot
  //     const parsedClock = await connection.getParsedAccountInfo(
  //       SYSVAR_CLOCK_PUBKEY
  //     );
  //     const parsedClockAccount = (parsedClock.value!.data as ParsedAccountData)
  //       .parsed as ParsedClockState;
  //     if (
  //       parsedClockAccount.info.slot <=
  //       dlmmPool.lbPair.swapCapDeactivateSlot.toNumber()
  //     ) {
  //       throttledStats = true;
  //       maxSwappedAmount = dlmmPool.lbPair.maxSwappedAmount;
  //     }
  //   }
  //   const swapQuote = throttledStats
  //     ? await dlmmPool.swapQuoteWithCap(
  //         swapAmount,
  //         swapYtoX,
  //         new BN(10),
  //         maxSwappedAmount,
  //         binArrays
  //       )
  //     : await dlmmPool.swapQuote(swapAmount, swapYtoX, new BN(10), binArrays);

  //   console.log("🚀 ~ swapQuote:", swapQuote);

  //   // Swap
  //   const swapTx = await dlmmPool.swap({
  //     inToken: dlmmPool.tokenX.publicKey,
  //     binArraysPubkey: swapQuote.binArraysPubkey,
  //     inAmount: swapAmount,
  //     lbPair: dlmmPool.pubkey,
  //     user: user.publicKey,
  //     minOutAmount: swapQuote.minOutAmount,
  //     outToken: dlmmPool.tokenY.publicKey,
  //   });

  //   try {
  //     const swapTxHash = await sendAndConfirmTransaction(connection, swapTx, [
  //       user,
  //     ]);
  //     console.log("🚀 ~ swapTxHash:", swapTxHash);
  //   } catch (error) {
  //     console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
  //   }
  // }
}
