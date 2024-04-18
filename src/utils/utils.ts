import { Logger } from "pino";
import dotenv from "dotenv";

dotenv.config();

export const retrieveEnvVariable = (variableName: string, logger: Logger) => {
  const variable = process.env[variableName] || "";
  if (!variable) {
    logger.error(`${variableName} is not set`);
    process.exit(1);
  }
  return variable;
};

export async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export const parseNumber = (number: string | number) =>
  Number(number).toFixed(2);
