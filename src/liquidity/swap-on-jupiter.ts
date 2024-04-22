import { Connection, VersionedTransaction } from "@solana/web3.js";
import { Wallet } from "@project-serum/anchor";

import { getSerializedTx, getTransactionQuote } from "../api";
import { logger } from "../utils";

// const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY)));

// const solanaConnection = new Connection(RPC_ENDPOINT, "finalized");
// const inputMint = "So11111111111111111111111111111111111111112";
// const outputMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

type SwapOnJupiterParams = {
  connection: Connection;
  wallet: Wallet;
  inputMint: string;
  outputMint: string;
  amount: number;
};

export async function swapOnJupiter({
  connection,
  wallet,
  inputMint,
  outputMint,
  amount,
}: SwapOnJupiterParams) {
  logger.info("Get Transaction Quote from Jupiter");
  const quoteResponse = await getTransactionQuote({
    inputMint: inputMint,
    outputMint: outputMint,
    amount,
  });

  console.log("🚀 ~ quoteResponse:", quoteResponse);
  logger.info("Get Serialized Tx from Jupiter");
  const { swapTransaction } = await getSerializedTx({
    quote: quoteResponse,
    wallet,
  });

  console.log("🚀 ~ swapTransaction:", swapTransaction);

  const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  // sign the transaction
  logger.info("Sign Tx");
  transaction.sign([wallet.payer]);
  const rawTransaction = transaction.serialize();

  try {
    logger.info("Executing Swap Token transaction");
    // Execute the transaction
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
    });
    await connection.confirmTransaction(txid);
    logger.info(`Transaction finish: https://solscan.io/tx/${txid}`);

    // Return Tx Result
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}
