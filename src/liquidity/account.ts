import DLMM from "@meteora-ag/dlmm";
import { SPL_ACCOUNT_LAYOUT, TokenAccount } from "@raydium-io/raydium-sdk";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Commitment, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getPoolInfo } from "../api";
import { MeteoraDlmm } from "./meteora-provider";
import { swapOnJupiter } from "./swap-on-jupiter";
import { delay, logger } from "../utils";
import { TokenBalance } from "../utils/types/account";
import { SWAP_AMOUNT_RATIO } from "../constants";
import { Wallet } from "@project-serum/anchor";
import { convertPositionMapToArray } from "../utils/helper";

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
      mintPubKey: tokenAc.accountInfo.mint.toString(),
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
  const Liquidity = new MeteoraDlmm(userWallet);
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
    const isTxSuccess = await Liquidity.removeSinglePositionLiquidity(
      dlmmPool,
      position
    );

    if (isTxSuccess) {
      // Swap Exceed Token
      const inputMint =
        Number(positionTokenDetails.mintX.amount) > 0 ? mint_x : mint_y;
      const outputMint = inputMint === mint_x ? mint_y : mint_x;

      // Get Account Token Amount
      const accountBalances = await getWalletTokenBalances(
        connection,
        userWallet.publicKey
      );

      const inputMintAccountBalance = accountBalances.find(
        (tokenAc) => tokenAc.mintPubKey === inputMint
      );

      // If Token not exist / balance = 0
      if (
        !inputMintAccountBalance ||
        Number(inputMintAccountBalance.value.amount) === 0
      ) {
        logger.warn(`Input Mint Token:${inputMint} not found in wallet`);
        throw new Error(`Input Mint Token:${inputMint} not found in wallet`);
      }

      const inputMintAmount =
        (Number(inputMintAccountBalance.value.amount) * SWAP_AMOUNT_RATIO) /
        100;

      logger.info(`Swapping ${inputMintAmount} ${inputMint} to ${outputMint}`);
      const isSwapSuccess = await swapOnJupiter({
        inputMint,
        outputMint,
        amount: inputMintAmount,
        connection,
        wallet: userWallet,
      });

      if (isSwapSuccess) {
        // Add Liquidity Again
        logger.info(`Adding New Liquidity...`);
        await Liquidity.createBalancePosition(dlmmPool, inputMintAmount);
      }
    } else {
      logger.info("Failed to remove position, pipeline stopped");
    }
  }
};

export const checkWalletPositions = async (
  connection: Connection,
  userPubKey: PublicKey
) => {
  try {
    const positions = await DLMM.getAllLbPairPositionsByUser(
      connection,
      userPubKey
    );
    const positionsArray = convertPositionMapToArray(positions);
    await delay(1000);
    return positionsArray;
  } catch (error) {
    console.log(error);
  }
};

export const checkWalletPositionInRange = async (
  connection: Connection,
  wallets: string[]
) => {
  for (const wallet of wallets) {
    const walletIns = new PublicKey(wallet);
    const positions = await DLMM.getAllLbPairPositionsByUser(
      connection,
      walletIns
    );
    console.log("🚀 ~ positions:", positions);
  }
};
