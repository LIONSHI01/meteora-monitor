import { Pair } from "./meteora";

export type PoolStatsResponse = {
  data: ResponseData;
};

export type ResponseData = {
  id: string;
  type: string;
  attributes: Attributes;
  relationships: Relationships;
};

export interface Attributes {
  base_token_price_usd: string;
  base_token_price_native_currency: string;
  quote_token_price_usd: string;
  quote_token_price_native_currency: string;
  base_token_price_quote_token: string;
  quote_token_price_base_token: string;
  address: string;
  name: string;
  pool_created_at: string;
  fdv_usd: string;
  market_cap_usd: string;
  price_change_percentage: PriceChangePercentage;
  transactions: Transactions;
  volume_usd: VolumeUsd;
  reserve_in_usd: string;
}

export interface PriceChangePercentage {
  m5: string;
  h1: string;
  h6: string;
  h24: string;
}

export interface Transactions {
  m5: Tx;
  m15: Tx;
  m30: Tx;
  h1: Tx;
  h24: Tx;
}

type Tx = {
  buys: number;
  sells: number;
  buyers: number;
  sellers: number;
};

export interface VolumeUsd {
  m5: string;
  h1: string;
  h6: string;
  h24: string;
}

export interface Relationships {
  base_token: BaseToken;
  quote_token: QuoteToken;
  dex: Dex;
}

export interface BaseToken {
  data: Data2;
}

export interface Data2 {
  id: string;
  type: string;
}

export interface QuoteToken {
  data: Data3;
}

export interface Data3 {
  id: string;
  type: string;
}

export interface Dex {
  data: Data4;
}

export interface Data4 {
  id: string;
  type: string;
}

export type PairWithMarketData = Pair & {
  priceM5: string;
  priceH1: string;
  priceH6: string;
  priceH24: string;
  txM5: Tx;
  txM15: Tx;
  txM30: Tx;
  volM5: string;
  volH1: string;
  volH6: string;
  volH24: string;
};
