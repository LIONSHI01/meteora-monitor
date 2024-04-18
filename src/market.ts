import { getPoolMarket } from "./api/geckoterminal";

async function poolMarket() {
  const res = await getPoolMarket(
    "8nGw9VHzwTBLcAfxWYnFLWbind4tJPSAXiq8nB89mx9d"
  );
  console.log(res);
}

async function main() {
  await poolMarket();
}

main();
