import DLMM from "@meteora-ag/dlmm";
import { SPL_ACCOUNT_LAYOUT, TokenAccount } from "@raydium-io/raydium-sdk";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Commitment, Connection, PublicKey } from "@solana/web3.js";
import { getPoolInfo } from "../api";
import { MeteoraDlmm } from "./meteora-provider";
import { swapOnJupiter } from "./swap-on-jupiter";
import { Wallet } from "@project-serum/anchor";
import { logger } from "../utils";
import { TokenBalance } from "../utils/types/account";

export async function getTokenAccounts(
  connection: Connection,
  owner: PublicKey,
  commitment?: Commitment
) {
  const tokenResp = await connection.getTokenAccountsByOwner(
    owner,
    {
      programId: TOKEN_PROGRAM_ID,
    },
    commitment
  );

  const accounts: TokenAccount[] = [];
  for (const { pubkey, account } of tokenResp.value) {
    accounts.push({
      pubkey,
      programId: account.owner,
      accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data),
    });
  }

  return accounts;
}

export async function getTokenBalance(
  connection: Connection,
  mintPubKey: PublicKey,
  commitment?: Commitment
) {
  try {
    const tokenBalance = await connection.getTokenAccountBalance(
      mintPubKey,
      commitment
    );
    return tokenBalance;
  } catch (error) {
    console.error("Error fetching token balance:", error);
  }
}

export const getWalletTokenBalances = async (
  connection: Connection,
  walletPubKey: PublicKey,
  commitment?: Commitment
) => {
  let tokenBalances: TokenBalance[] = [];

  const tokenAccounts = await getTokenAccounts(
    connection,
    walletPubKey,
    commitment
  );

  for (const tokenAc of tokenAccounts) {
    const tokenBalance = await getTokenBalance(connection, tokenAc.pubkey);

    tokenBalances.push({
      ...tokenBalance,
      mintPubKey: tokenAc.pubkey.toString(),
    });
  }

  return tokenBalances;
};

export const monitorPositions = async (
  connection: Connection,
  poolAddress: string,
  userWallet: Wallet
) => {
  // Fetch Pool Info via API
  const poolInfo = await getPoolInfo(poolAddress);
  const { mint_x, mint_y } = poolInfo || {};

  // Get Position states
  const Pool = new PublicKey(poolAddress);

  const dlmmPool = await DLMM.create(connection, Pool);
  const Liquidity = new MeteoraDlmm(dlmmPool);
  const { userPositions, activeBin } =
    await dlmmPool.getPositionsByUserAndLbPair(userWallet.publicKey);

  for (const position of userPositions) {
    const { lowerBinId, upperBinId } = position.positionData;
    const positionTokenDetails = {
      mintX: {
        tokenAddress: mint_x,
        amount: position.positionData.totalXAmount,
      },
      mintY: {
        tokenAddress: mint_y,
        amount: position.positionData.totalYAmount,
      },
      lowerBinId,
      upperBinId,
      activeBin,
    };

    // Exit Liquidity
    const isTxSuccess = await Liquidity.removeSinglePositionLiquidity(position);

    if (isTxSuccess) {
      // Swap Exceed Token
      const inputMint =
        Number(positionTokenDetails.mintX.amount) > 0 ? mint_x : mint_y;
      const outputMint = inputMint === mint_x ? mint_y : mint_x;

      // Get Account Token Amount

      await swapOnJupiter({
        inputMint,
        outputMint,
        amount: 100000,
        connection,
        wallet: userWallet,
      });
    } else {
      logger.info("Failed to remove position, pipeline stopped");
    }

    // Add Liquidity Again

    // console.log({
    //   lowerBinId,
    //   upperBinId,
    //   activeBin,
    // });
  }
};
