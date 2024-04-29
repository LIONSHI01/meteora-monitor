import fs from "fs";

import { logger } from "../logger";
import { WalletRecord } from "../types/account";
import { resolve } from "path";

export const loadLocalWalletList = () => {
  let walletList: WalletRecord[] = [];

  logger.info(`Loading wallet list...`);

  const poolListPath = resolve("./wallet-track-list.txt");
  const data = fs.readFileSync(poolListPath, "utf-8");

  walletList = data
    .split("\n")
    .map((a) => a.trim())
    .filter((a) => a)
    .map((a) => {
      const [name, address] = a.split(",");
      return {
        name,
        address,
      };
    });

  logger.info(`Checking ${walletList.length} wallets.`);

  return walletList;
};
