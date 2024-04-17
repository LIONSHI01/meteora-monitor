import { apiInstance } from "../api/api-handler";

export const getAccountEarnings = (
  walletAddress: string,
  pairAddress: string
) => apiInstance.get(`/wallet/${walletAddress}/${pairAddress}/earning`);
