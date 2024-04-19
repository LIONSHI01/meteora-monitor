import { create, type ApiResponse } from "apisauce";

import {
  GETCOTERMINAL_API_BASE_URL,
  GETCOTERMINAL_API_VERSION,
} from "../constants";
import { PoolStatsResponse } from "../utils/types/gecko";

export const geckoApiInstance = create({
  baseURL: GETCOTERMINAL_API_BASE_URL,
  headers: {
    Accept: `application/json;version=${GETCOTERMINAL_API_VERSION}`,
  },
});

export const getPoolMarket = async (poolAddress: string) => {
  try {
    const res: ApiResponse<PoolStatsResponse, PoolStatsResponse> =
      await geckoApiInstance.get(`/networks/solana/pools/${poolAddress}`);

    if (res?.data?.data) {
      return res.data.data;
    } else {
      throw Error("Failed to fetch Pool Data from Geckoterminal API.");
    }
  } catch (error) {
    console.log("🚀 ~ getAllPairs ~ error:", error);
  }
};
