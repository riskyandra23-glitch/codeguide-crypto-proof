import { ethers } from 'ethers';

// ERC-20 ABI for balance and token info queries
const ERC20_ABI = [
  // Balance of
  'function balanceOf(address owner) view returns (uint256)',
  // Decimals
  'function decimals() view returns (uint8)',
  // Symbol
  'function symbol() view returns (string)',
  // Name
  'function name() view returns (string)'
];

// Common token addresses on different chains
const COMMON_TOKENS = {
  ethereum: [
    { address: '0xA0b86a33E6441b8e8C7C7b0b8e8e8e8e8e8e8e8e', symbol: 'USDC', decimals: 6, name: 'USD Coin' },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6, name: 'Tether USD' },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', decimals: 8, name: 'Wrapped Bitcoin' }
  ],
  bsc: [
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', decimals: 6, name: 'USD Coin' },
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', decimals: 18, name: 'Tether USD' },
    { address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', symbol: 'BTCB', decimals: 8, name: 'Bitcoin BEP2' }
  ],
  polygon: [
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', decimals: 6, name: 'USD Coin' },
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', decimals: 6, name: 'Tether USD' },
    { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', symbol: 'WBTC', decimals: 8, name: 'Wrapped Bitcoin' }
  ]
};

// Chain configurations
export const CHAIN_CONFIGS = {
  ethereum: {
    name: 'Ethereum',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    nativeCurrency: { symbol: 'ETH', decimals: 18 }
  },
  bsc: {
    name: 'Binance Smart Chain',
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
    nativeCurrency: { symbol: 'BNB', decimals: 18 }
  },
  polygon: {
    name: 'Polygon',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    nativeCurrency: { symbol: 'MATIC', decimals: 18 }
  }
};

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  usdValue?: number;
  address: string;
  name: string;
  chain: string;
}

export interface ChainBalance {
  chain: string;
  nativeBalance: string;
  nativeUsdValue?: number;
  tokens: TokenBalance[];
  totalUsdValue: number;
}

export interface AggregatedBalance {
  address: string;
  chains: ChainBalance[];
  totalUsdValue: number;
  lastUpdated: Date;
}

// Price cache to avoid repeated API calls
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000
};

// Retry logic with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.maxRetries
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
        RETRY_CONFIG.maxDelay
      );

      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}

// Get provider for a specific chain
function getProvider(chain: string): ethers.JsonRpcProvider {
  const config = CHAIN_CONFIGS[chain as keyof typeof CHAIN_CONFIGS];
  if (!config) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  return new ethers.JsonRpcProvider(config.rpcUrl);
}

// Get native token balance
async function getNativeBalance(
  provider: ethers.JsonRpcProvider,
  address: string,
  chain: string
): Promise<{ balance: string; usdValue?: number }> {
  try {
    const balance = await retryWithBackoff(() => provider.getBalance(address));
    const config = CHAIN_CONFIGS[chain as keyof typeof CHAIN_CONFIGS];
    const formattedBalance = ethers.formatEther(balance);

    // Get USD price
    const usdValue = await getTokenPrice(config.nativeCurrency.symbol.toLowerCase());

    return {
      balance: formattedBalance,
      usdValue: usdValue ? parseFloat(formattedBalance) * usdValue : undefined
    };
  } catch (error) {
    console.error(`Error fetching native balance for ${chain}:`, error);
    return { balance: '0' };
  }
}

// Get ERC-20 token balance
async function getTokenBalance(
  provider: ethers.JsonRpcProvider,
  tokenAddress: string,
  walletAddress: string,
  tokenInfo: { symbol: string; decimals: number; name: string },
  chain: string
): Promise<TokenBalance | null> {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    const [balance] = await retryWithBackoff(() =>
      Promise.all([
        contract.balanceOf(walletAddress)
      ])
    );

    const formattedBalance = ethers.formatUnits(balance, tokenInfo.decimals);
    const usdValue = await getTokenPrice(tokenInfo.symbol.toLowerCase());

    return {
      symbol: tokenInfo.symbol,
      balance: formattedBalance,
      decimals: tokenInfo.decimals,
      usdValue: usdValue ? parseFloat(formattedBalance) * usdValue : undefined,
      address: tokenAddress,
      name: tokenInfo.name,
      chain
    };
  } catch (error) {
    console.error(`Error fetching token balance for ${tokenInfo.symbol}:`, error);
    return null;
  }
}

// Get token price from CoinGecko API
async function getTokenPrice(symbol: string): Promise<number | null> {
  const cacheKey = `price_${symbol}`;
  const cached = priceCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }

  try {
    // Map common symbols to CoinGecko IDs
    const symbolMap: { [key: string]: string } = {
      'eth': 'ethereum',
      'bnb': 'binancecoin',
      'matic': 'matic-network',
      'usdc': 'usd-coin',
      'usdt': 'tether',
      'wbtc': 'wrapped-bitcoin',
      'btcb': 'bitcoin-bep2'
    };

    const coinId = symbolMap[symbol.toLowerCase()];
    if (!coinId) {
      return null;
    }

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data[coinId]?.usd || null;

    if (price) {
      priceCache.set(cacheKey, { price, timestamp: Date.now() });
    }

    return price;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

// Get balances for a single chain
async function getChainBalances(address: string, chain: string): Promise<ChainBalance> {
  try {
    const provider = getProvider(chain);
    const commonTokens = COMMON_TOKENS[chain as keyof typeof COMMON_TOKENS] || [];

    // Get native balance
    const nativeBalance = await getNativeBalance(provider, address, chain);

    // Get token balances
    const tokenPromises = commonTokens.map(token =>
      getTokenBalance(provider, token.address, address, token, chain)
    );

    const tokenResults = await Promise.allSettled(tokenPromises);
    const tokens = tokenResults
      .filter((result): result is PromiseFulfilledResult<TokenBalance> =>
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value!)
      .filter(token => parseFloat(token.balance) > 0);

    // Calculate total USD value
    const totalUsdValue = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0) +
                         (nativeBalance.usdValue || 0);

    return {
      chain,
      nativeBalance: nativeBalance.balance,
      nativeUsdValue: nativeBalance.usdValue,
      tokens,
      totalUsdValue
    };
  } catch (error) {
    console.error(`Error fetching balances for chain ${chain}:`, error);
    return {
      chain,
      nativeBalance: '0',
      tokens: [],
      totalUsdValue: 0
    };
  }
}

// Main function to get aggregated balances across all chains
export async function getAggregatedBalances(address: string): Promise<AggregatedBalance> {
  // Validate address format
  if (!ethers.isAddress(address)) {
    throw new Error('Invalid Ethereum address format');
  }

  const chains = Object.keys(CHAIN_CONFIGS);
  const chainPromises = chains.map(chain => getChainBalances(address, chain));

  const chainResults = await Promise.allSettled(chainPromises);
  const validChains = chainResults
    .filter((result): result is PromiseFulfilledResult<ChainBalance> =>
      result.status === 'fulfilled'
    )
    .map(result => result.value);

  const totalUsdValue = validChains.reduce((sum, chain) => sum + chain.totalUsdValue, 0);

  return {
    address,
    chains: validChains,
    totalUsdValue,
    lastUpdated: new Date()
  };
}

// Validate address format
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

// Format address for display
export function formatAddress(address: string, length: number = 6): string {
  if (!isValidAddress(address)) {
    return address;
  }

  return `${address.substring(0, length)}...${address.substring(address.length - 4)}`;
}

// Format currency value
export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

// Format token balance
export function formatTokenBalance(balance: string, decimals: number = 4): string {
  const value = parseFloat(balance);
  if (value === 0) return '0';

  // For very small values, show more decimals
  if (value < 0.001) {
    return value.toFixed(8).replace(/\.?0+$/, '');
  }

  return value.toFixed(decimals).replace(/\.?0+$/, '');
}