import { Connection, PublicKey } from "@solana/web3.js";
import { logger } from "ethers";
import DLMM from "@meteora-ag/dlmm";
import _ from "lodash";
import { Context, Telegraf } from "telegraf";

import { METEORA_APP_DOMAIN, TELEGRAM_CHAT_ROOM_ID } from "../constants";
import { loadLocalWalletList } from "../utils/helper";
import { checkWalletPositions } from "../liquidity";
import { delay } from "../utils";
import { getPoolInfo } from "../api";
import { Update } from "@telegraf/types";

export const checkWalletPositionsInRange = async (
  connection: Connection,
  bot: Telegraf<Context<Update>>
) => {
  const walletList = loadLocalWalletList();

  logger.info("=== 🧘‍♂️ New round checking Started. 🧘‍♂️ ===");

  if (walletList.length === 0) {
    logger.info("No wallets found. Skip Positions Checking.");
    return;
  }

  for (const wallet of walletList) {
    logger.info(`=== Wallet: ${wallet.name} ===`);
    const walletPubKey = new PublicKey(wallet.address);
    const positions = await checkWalletPositions(connection, walletPubKey);
    logger.info(`Wallet ${wallet.name}: ${positions.length} Position(s)`);

    for (let i = 0; i < positions.length; i++) {
      logger.info(`Checking Position ${i + 1}`);
      // for (const pos of positions) {
      const { position } = positions[i] || {};
      const { publicKey: poolPubKey } = position || {};
      const poolInfo = await getPoolInfo(poolPubKey.toString());

      const dlmmPool = await DLMM.create(connection, poolPubKey);
      const { userPositions, activeBin } =
        await dlmmPool.getPositionsByUserAndLbPair(walletPubKey);

      for (const position of userPositions) {
        const { lowerBinId, upperBinId } = position.positionData;
        const isPositionWithinRange = _.inRange(
          activeBin.binId,
          lowerBinId,
          upperBinId
        );

        if (isPositionWithinRange) {
          logger.info(`Result: Position is within range. \n`);
        }

        if (!isPositionWithinRange) {
          logger.info("Detected Position out of range. \n");

          const poolUrl = `${METEORA_APP_DOMAIN}/${poolInfo.address}`;
          const message = `
          Position is out of range!
          Wallet Name: ${wallet.name}
          Wallet Address: ${wallet.address}
          Link: ${poolUrl}
            `;

          bot.telegram.sendMessage(TELEGRAM_CHAT_ROOM_ID, message);
          await delay(1000);
        }
      }
    }
  }

  logger.info("=== 🍻 This round's checking finish. 🍻 ===");
};
