import { create } from "apisauce";
import { METEORA_API_DOMAIN } from "../constants";

export const apiInstance = create({
  baseURL: METEORA_API_DOMAIN,
});
