export interface ChainBalance {
  chain: string;
  nativeBalance: string;
  nativeUsdValue?: number;
  tokens: TokenBalance[];
  totalUsdValue: number;
}

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  usdValue?: number;
  address: string;
  name: string;
  chain: string;
}

export interface AggregatedBalance {
  address: string;
  chains: ChainBalance[];
  totalUsdValue: number;
  lastUpdated: Date;
}

export interface WalletInfo {
  address: string;
  chainId: number;
  isConnected: boolean;
}

export interface BalanceResponse {
  success: boolean;
  data: AggregatedBalance;
}