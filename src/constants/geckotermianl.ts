import { logger, retrieveEnvVariable } from "../utils";

export const GETCOTERMINAL_API_BASE_URL = retrieveEnvVariable(
  "GETCOTERMINAL_API_BASE_URL",
  logger
);
export const GETCOTERMINAL_API_VERSION = Number(
  retrieveEnvVariable("GETCOTERMINAL_API_VERSION", logger)
);
