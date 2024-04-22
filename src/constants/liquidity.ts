import { logger, retrieveEnvVariable } from "../utils";

export const SWAP_AMOUNT_RATIO = Number(
  retrieveEnvVariable("SWAP_AMOUNT_RATIO", logger)
);
