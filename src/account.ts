import { getAccountEarnings } from "./account/account";

import { WALLET_ADDRESS } from "./constants";

const pairAddress = "HtVMVmHCzfJcfkH74gZFUBz8AaPx2psctPWnw2W14t7v";

async function main() {
  const res = await getAccountEarnings(WALLET_ADDRESS, pairAddress);
  console.log("🚀 ~ main ~ res:", res);
}

main();
