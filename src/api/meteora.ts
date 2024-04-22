import { create } from "apisauce";

import { METEORA_API_DOMAIN } from "../constants";
import { ApiResponse } from "apisauce";
import { Pair, PoolInfoResponse } from "../utils/types";

export const meteoraApiInstance = create({
  baseURL: METEORA_API_DOMAIN,
});

export const getAllPairs = async () => {
  try {
    const res: ApiResponse<Pair[], Pair[]> = await meteoraApiInstance.get(
      "/pair/all"
    );

    if (res?.data) {
      return res.data;
    } else {
      throw new Error("Failed to fetch All Pairs from Meteora API.");
    }
  } catch (error) {
    console.log("🚀 ~ getAllPairs ~ error:", error);
  }
};

export const getPoolInfo = async (poolAddress: string) => {
  try {
    const res: ApiResponse<PoolInfoResponse, PoolInfoResponse> =
      await meteoraApiInstance.get(`/pair/${poolAddress}`);

    if (res?.data) {
      return res.data;
    } else {
      throw new Error(
        `Failed to fetch Info of Pool: ${poolAddress} from Meteora API.`
      );
    }
  } catch (error) {
    console.log(
      `Failed to fetch Info of Pool: ${poolAddress} from Meteora API.`,
      error
    );
  }
};
