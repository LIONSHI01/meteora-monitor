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
