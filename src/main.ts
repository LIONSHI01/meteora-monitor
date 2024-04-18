import DLMM from "@meteora-ag/dlmm";
import bs58 from "bs58";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";

import {
  RPC_ENDPOINT,
  RPC_WEBSOCKET_ENDPOINT,
  PRIVATE_KEY,
  WALLET_ADDRESS,
} from "./constants";
import { BN } from "@coral-xyz/anchor";

const main = async () => {
  const user = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

  const USDC_USDT_POOL = new PublicKey(
    "ARwi1S4DaiTG5DX7S4M4ZsrXqpMD1MrTmbu9ue2tpmEq"
  ); // You can get
  const PUPS_SOL_POOL = new PublicKey(
    "HtVMVmHCzfJcfkH74gZFUBz8AaPx2psctPWnw2W14t7v"
  ); // You can get
  const connection = new Connection(RPC_ENDPOINT, {
    wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
  });
  const dlmmPool = await DLMM.create(connection, PUPS_SOL_POOL);
  const { userPositions, activeBin } =
    await dlmmPool.getPositionsByUserAndLbPair(user.publicKey);
};

main();
