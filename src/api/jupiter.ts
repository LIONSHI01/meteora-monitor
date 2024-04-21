import { create, type ApiResponse } from "apisauce";

import { JUPITER_API_BASE_URL } from "../constants";
import { QuoteResponse, SerializedTxResponse } from "../utils/types/jupiter";

const jupiterApiInstance = create({
  baseURL: JUPITER_API_BASE_URL,
});

type GetTransactionQuoteParams = {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippage?: number;
};
export const getTransactionQuote = async ({
  inputMint,
  outputMint,
  amount,
  slippage = 100,
}: GetTransactionQuoteParams) => {
  try {
    const response: ApiResponse<QuoteResponse, QuoteResponse> =
      await jupiterApiInstance.get(
        `/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippage}`
      );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

type GetSerializedTxParams = {
  quote: QuoteResponse;
  wallet: any;
  wrapAndUnwrapSol?: boolean;
};

export const getSerializedTx = async ({
  quote,
  wallet,
  wrapAndUnwrapSol = true,
}: GetSerializedTxParams) => {
  try {
    const res: ApiResponse<SerializedTxResponse, SerializedTxResponse> =
      await jupiterApiInstance.post("/swap", {
        quoteResponse: quote,
        userPublicKey: wallet.publicKey.toString(),
        wrapAndUnwrapSol,
      });
    return res.data;
  } catch (error) {
    console.log(error);
  }
};
