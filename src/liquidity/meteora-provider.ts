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
import { Wallet } from "ethers";

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
  dlmmPool: DLMM;

  constructor(dlmmPool: DLMM) {
    this.dlmmPool = dlmmPool;
  }

  async getActiveBin() {
    // Get pool state
    logger.info("Get active bin");
    const activeBin = await this.dlmmPool.getActiveBin();
    return activeBin;
  }

  async createBalancePosition(tokenXAmount: number) {
    const newBalancePosition = new Keypair();
    const activeBin = await this.getActiveBin();

    logger.info("Create LP Position");
    const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
    const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
    const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

    const activeBinPricePerToken = this.dlmmPool.fromPricePerLamport(
      Number(activeBin.price)
    );
    const totalXAmount = new BN(tokenXAmount);
    const totalYAmount = totalXAmount.mul(
      new BN(Number(activeBinPricePerToken))
    );

    logger.info("Create Position Tx");
    // Create Position
    const createPositionTx =
      await this.dlmmPool.initializePositionAndAddLiquidityByStrategy({
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

  async getPositionsState() {
    // Get position state
    try {
      const positionsState = await this.dlmmPool.getPositionsByUserAndLbPair(
        user.publicKey
      );

      return positionsState.userPositions;
    } catch (error) {
      console.log(error);
    }
  }

  async removePoolPositions() {
    const userPositions = await this.getPositionsState();

    // Remove Liquidity
    const removeLiquidityTxs = (
      await Promise.all(
        userPositions.map(({ publicKey, positionData }) => {
          const binIdsToRemove = positionData.positionBinData.map(
            (bin) => bin.binId
          );
          return this.dlmmPool.removeLiquidity({
            position: publicKey,
            user: user.publicKey,
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
          [user],
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

  async removeSinglePositionLiquidity(position: LbPosition) {
    logger.info(`Start to remove Position: ${position.publicKey.toString()}`);

    const { publicKey, positionData } = position || {};
    const binIdsToRemove = positionData.positionBinData.map((bin) => bin.binId);

    logger.info(`Create Remove Liquidity Tx`);
    const removeLiquidityTxs = (await this.dlmmPool.removeLiquidity({
      position: publicKey,
      user: user.publicKey,
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
        [user],
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

  async swap(ySwapAmount: number) {
    const swapAmount = new BN(ySwapAmount);
    // Swap quote
    const swapYtoX = true;
    const binArrays = await this.dlmmPool.getBinArrayForSwap(swapYtoX);

    // check whether it is permission or permissionless pool
    let maxSwappedAmount: BN;
    let throttledStats: boolean;
    if (!swapYtoX && this.dlmmPool.lbPair.pairType == 1) {
      // get current slot
      const parsedClock = await connection.getParsedAccountInfo(
        SYSVAR_CLOCK_PUBKEY
      );
      const parsedClockAccount = (parsedClock.value!.data as ParsedAccountData)
        .parsed as ParsedClockState;
      if (
        parsedClockAccount.info.slot <=
        this.dlmmPool.lbPair.swapCapDeactivateSlot.toNumber()
      ) {
        throttledStats = true;
        maxSwappedAmount = this.dlmmPool.lbPair.maxSwappedAmount;
      }
    }
    const swapQuote = throttledStats
      ? await this.dlmmPool.swapQuoteWithCap(
          swapAmount,
          swapYtoX,
          new BN(10),
          maxSwappedAmount,
          binArrays
        )
      : await this.dlmmPool.swapQuote(
          swapAmount,
          swapYtoX,
          new BN(10),
          binArrays
        );

    console.log("🚀 ~ swapQuote:", swapQuote);

    // Swap
    const swapTx = await this.dlmmPool.swap({
      inToken: this.dlmmPool.tokenX.publicKey,
      binArraysPubkey: swapQuote.binArraysPubkey,
      inAmount: swapAmount,
      lbPair: this.dlmmPool.pubkey,
      user: user.publicKey,
      minOutAmount: swapQuote.minOutAmount,
      outToken: this.dlmmPool.tokenY.publicKey,
    });

    try {
      const swapTxHash = await sendAndConfirmTransaction(connection, swapTx, [
        user,
      ]);
      console.log("🚀 ~ swapTxHash:", swapTxHash);
    } catch (error) {
      console.log("🚀 ~ error:", JSON.parse(JSON.stringify(error)));
    }
  }
}
