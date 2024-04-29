import fs from "fs";
import { Connection, PublicKey } from "@solana/web3.js";
import { METEORA_APP_DOMAIN, RPC_ENDPOINT } from "./constants";
import { checkWalletPositions } from "./liquidity";
import { resolve } from "path";
import { logger } from "ethers";
import { getPoolInfo } from "./api";
import DLMM from "@meteora-ag/dlmm";
import { delay } from "./utils";
import _ from "lodash";
import { loadLocalWalletList } from "./utils/helper";

const solanaConnection = new Connection(RPC_ENDPOINT, "finalized");

const main = async () => {};

main();
