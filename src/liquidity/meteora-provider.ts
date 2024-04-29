import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SYSVAR_CLOCK_PUBKEY,
  ParsedAccountData,
  Transaction,
} from "@solana/web3.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import BN from "bn.js";
import DLMM, { BinLiquidity, LbPosition, StrategyType } from "@meteora-ag/dlmm";
import { logger } from "../utils";
import { PRIVATE_KEY, RPC_ENDPOINT } from "../constants";
import { Wallet } from "@project-serum/anchor";

// const user = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

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
  user: Wallet;
  constructor(user: Wallet) {
    this.user = user;
  }

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
        user: this.user.publicKey,
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
        [this.user.payer, newBalancePosition]
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

  async getPositionsState(dlmmPool: DLMM, userPubKey: PublicKey) {
    // Get position state
    try {
      const positionsState = await dlmmPool.getPositionsByUserAndLbPair(
        userPubKey
      );

      return positionsState.userPositions;
    } catch (error) {
      console.log(error);
    }
  }
  async getAllLbPairPositions() {
    // Get position state
    try {
      const positionsState = await DLMM.getAllLbPairPositionsByUser(
        connection,
        this.user.publicKey
      );

      return positionsState;
    } catch (error) {
      console.log(error);
    }
  }

  async removePoolPositions(dlmmPool: DLMM) {
    const userPositions = await this.getPositionsState(
      dlmmPool,
      this.user.publicKey
    );

    // Remove Liquidity
    const removeLiquidityTxs = (
      await Promise.all(
        userPositions.map(({ publicKey, positionData }) => {
          const binIdsToRemove = positionData.positionBinData.map(
            (bin) => bin.binId
          );
          return dlmmPool.removeLiquidity({
            position: publicKey,
            user: this.user.publicKey,
            binIds: binIdsToRemove,
            liquiditiesBpsToRemove: new Array(binIdsToRemove.length).fill(
              new BN(100 * 100)
            ),
            shouldClaimAndClose: true, // should claim swap fee and close position together
          });
        })
      )
    ).flat();

    try {
      for (let tx of removeLiquidityTxs) {
        const removeBalanceLiquidityTxHash = await sendAndConfirmTransaction(
          connection,
          tx,
          [this.user.payer],
          { skipPreflight: false, preflightCommitment: "confirmed" }
        );
        console.log(
          "🚀 ~ removeBalanceLiquidityTxHash:",
          removeBalanceLiquidityTxHash
        );
      }
    } catch (error) {
      console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
    }
  }

  async removeSinglePositionLiquidity(dlmmPool: DLMM, position: LbPosition) {
    logger.info(`Start to remove Position: ${position.publicKey.toString()}`);

    const { publicKey, positionData } = position || {};
    const binIdsToRemove = positionData.positionBinData.map((bin) => bin.binId);

    logger.info(`Create Remove Liquidity Tx`);
    const removeLiquidityTxs = (await dlmmPool.removeLiquidity({
      position: publicKey,
      user: this.user.publicKey,
      binIds: binIdsToRemove,
      liquiditiesBpsToRemove: new Array(binIdsToRemove.length).fill(
        new BN(100 * 100)
      ),
      shouldClaimAndClose: true, // should claim swap fee and close position together
    })) as Transaction;

    try {
      logger.info(`Execute and confirm tx`);
      const removeBalanceLiquidityTxHash = await sendAndConfirmTransaction(
        connection,
        removeLiquidityTxs,
        [this.user.payer],
        { skipPreflight: false, preflightCommitment: "confirmed" }
      );
      logger.info(`Tx confirmed: ${removeBalanceLiquidityTxHash}`);

      // Return success signal
      return true;
    } catch (error) {
      console.log("Error on Execute and confirm tx", error);
      return false;
    }
  }

  async swap(dlmmPool: DLMM, ySwapAmount: number) {
    const swapAmount = new BN(ySwapAmount);
    // Swap quote
    const swapYtoX = true;
    const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);

    // check whether it is permission or permissionless pool
    let maxSwappedAmount: BN;
    let throttledStats: boolean;
    if (!swapYtoX && dlmmPool.lbPair.pairType == 1) {
      // get current slot
      const parsedClock = await connection.getParsedAccountInfo(
        SYSVAR_CLOCK_PUBKEY
      );
      const parsedClockAccount = (parsedClock.value!.data as ParsedAccountData)
        .parsed as ParsedClockState;
      if (
        parsedClockAccount.info.slot <=
        dlmmPool.lbPair.swapCapDeactivateSlot.toNumber()
      ) {
        throttledStats = true;
        maxSwappedAmount = dlmmPool.lbPair.maxSwappedAmount;
      }
    }
    const swapQuote = throttledStats
      ? await dlmmPool.swapQuoteWithCap(
          swapAmount,
          swapYtoX,
          new BN(10),
          maxSwappedAmount,
          binArrays
        )
      : await dlmmPool.swapQuote(swapAmount, swapYtoX, new BN(10), binArrays);

    // Swap
    const swapTx = await dlmmPool.swap({
      inToken: dlmmPool.tokenX.publicKey,
      binArraysPubkey: swapQuote.binArraysPubkey,
      inAmount: swapAmount,
      lbPair: dlmmPool.pubkey,
      user: this.user.publicKey,
      minOutAmount: swapQuote.minOutAmount,
      outToken: dlmmPool.tokenY.publicKey,
    });

    try {
      const swapTxHash = await sendAndConfirmTransaction(connection, swapTx, [
        this.user.payer,
      ]);
      console.log("🚀 ~ swapTxHash:", swapTxHash);
    } catch (error) {
      console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
    }
  }
}
