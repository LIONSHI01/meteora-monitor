import { create } from "apisauce";

import { METEORA_API_DOMAIN } from "../constants";
import { ApiResponse } from "apisauce";
import { Pair } from "../utils/types";

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
      throw Error("Failed to fetch All Pairs from Meteora API.");
    }
  } catch (error) {
    console.log("🚀 ~ getAllPairs ~ error:", error);
  }
};
