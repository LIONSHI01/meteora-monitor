import { logger, retrieveEnvVariable } from "../utils";

// Pools Filter
export const MIN_24H_FEES = Number(retrieveEnvVariable("MIN_24H_FEES", logger));
export const MIN_24H_VOLUME = Number(
  retrieveEnvVariable("MIN_24H_VOLUME", logger)
);
export const MIN_APR = Number(retrieveEnvVariable("MIN_APR", logger));
export const MIN_LTV = Number(retrieveEnvVariable("MIN_LTV", logger));

// Watch List Filter
export const WATCHLIST_MIN_24H_FEES = Number(
  retrieveEnvVariable("WATCHLIST_MIN_24H_FEES", logger)
);
export const WATCHLIST_MIN_24H_VOLUME = Number(
  retrieveEnvVariable("WATCHLIST_MIN_24H_VOLUME", logger)
);
export const WATCHLIST_MIN_APR = Number(
  retrieveEnvVariable("WATCHLIST_MIN_APR", logger)
);
export const WATCHLIST_MIN_LTV = Number(
  retrieveEnvVariable("WATCHLIST_MIN_LTV", logger)
);

// High Yield Pools
export const HIGH_YIELD_POOL_MIN_24H_FEES = Number(
  retrieveEnvVariable("HIGH_YIELD_POOL_MIN_24H_FEES", logger)
);
export const HIGH_YIELD_POOL_MIN_24H_VOLUME = Number(
  retrieveEnvVariable("HIGH_YIELD_POOL_MIN_24H_VOLUME", logger)
);
export const HIGH_YIELD_POOL_MIN_APR = Number(
  retrieveEnvVariable("HIGH_YIELD_POOL_MIN_APR", logger)
);
export const HIGH_YIELD_POOL_MIN_LTV = Number(
  retrieveEnvVariable("HIGH_YIELD_POOL_MIN_LTV", logger)
);
