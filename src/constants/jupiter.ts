import { logger, retrieveEnvVariable } from "../utils";

export const JUPITER_API_BASE_URL = retrieveEnvVariable(
  "JUPITER_API_BASE_URL",
  logger
);
