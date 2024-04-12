import { Commitment } from "@solana/web3.js";
import { logger, retrieveEnvVariable } from "../utils";

export const NETWORK = "mainnet-beta";
export const COMMITMENT_LEVEL: Commitment = retrieveEnvVariable(
  "COMMITMENT_LEVEL",
  logger
) as Commitment;
export const RPC_ENDPOINT = retrieveEnvVariable("RPC_ENDPOINT", logger);
export const RPC_WEBSOCKET_ENDPOINT = retrieveEnvVariable(
  "RPC_WEBSOCKET_ENDPOINT",
  logger
);
export const METEORA_API_DOMAIN = retrieveEnvVariable(
  "METEORA_API_DOMAIN",
  logger
);

// Wallet Related
export const WALLET_ADDRESS = retrieveEnvVariable("WALLET_ADDRESS", logger);
export const PRIVATE_KEY = retrieveEnvVariable("PRIVATE_KEY", logger);
