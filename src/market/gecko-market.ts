import { getPoolMarket } from "../api/geckoterminal";

export async function getPoolMarketStats(poolAddress: string) {
  const apiResponse = await getPoolMarket(poolAddress);
  const { attributes } = apiResponse || {};
  const { price_change_percentage, transactions, volume_usd } =
    attributes || {};
  const {
    m5: priceM5,
    h1: priceH1,
    h6: priceH6,
    h24: priceH24,
  } = price_change_percentage || {};
  const { m5: txM5, m15: txM15, m30: txM30 } = transactions || {};
  const { m5: volM5, h1: volH1, h6: volH6, h24: volH24 } = volume_usd || {};

  return {
    priceM5,
    priceH1,
    priceH6,
    priceH24,
    txM5,
    txM15,
    txM30,
    volM5,
    volH1,
    volH6,
    volH24,
  };
}
