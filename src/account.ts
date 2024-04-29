// const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY)));

import {
  Connection,
  Keypair,
  RpcResponseAndContext,
  TokenAmount,
} from "@solana/web3.js";
import { COMMITMENT_LEVEL, PRIVATE_KEY, RPC_ENDPOINT } from "./constants";
import {
  checkWalletPositionInRange,
  getTokenAccounts,
  getTokenBalance,
} from "./liquidity";
import { Wallet } from "@coral-xyz/anchor";
import bs58 from "bs58";

const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY)));
const solanaConnection = new Connection(RPC_ENDPOINT, "finalized");

type TokenBalance = RpcResponseAndContext<TokenAmount> & {
  mintPubKey: string;
};

let tokenBalances: TokenBalance[] = [];

async function account() {
  const tokenAccounts = await getTokenAccounts(
    solanaConnection,
    wallet.publicKey,
    COMMITMENT_LEVEL
  );

  for (const tokenAc of tokenAccounts) {
    const tokenBalance = await getTokenBalance(
      solanaConnection,
      tokenAc.pubkey
    );

    tokenBalances.push({
      ...tokenBalance,
      mintPubKey: tokenAc.accountInfo.mint.toString(),
    });
  }
}
