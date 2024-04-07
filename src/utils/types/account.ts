import { RpcResponseAndContext, TokenAmount } from "@solana/web3.js";

export type TokenBalance = RpcResponseAndContext<TokenAmount> & {
  mintPubKey: string;
};
