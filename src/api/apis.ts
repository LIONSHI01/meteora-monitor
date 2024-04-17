import { ApiResponse } from "apisauce";
import { Pair } from "../utils/types";
import { apiInstance } from "./api-handler";

export const getAllPairs = async () => {
  try {
    const res: ApiResponse<Pair[], Pair[]> = await apiInstance.get("/pair/all");

    return res.data;
  } catch (error) {
    console.log("🚀 ~ getAllPairs ~ error:", error);
  }
};
