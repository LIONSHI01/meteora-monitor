import DLMM from '@meteora-ag/dlmm'
import {
  Keypair,
  Connection,
  PublicKey,
  ComputeBudgetProgram,
  KeyedAccountInfo,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import {
  RPC_ENDPOINT,
  RPC_WEBSOCKET_ENDPOINT,
} from './constants';

const USDC_USDT_POOL = new PublicKey('ARwi1S4DaiTG5DX7S4M4ZsrXqpMD1MrTmbu9ue2tpmEq') // You can get 
const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
})
const dlmmPool = await DLMM.create(connection, USDC_USDT_POOL);

// If you need to create multiple, can consider using `createMultiple`
const dlmmPool = await DLMM.create(connection, [USDC_USDT_POOL, ...]);