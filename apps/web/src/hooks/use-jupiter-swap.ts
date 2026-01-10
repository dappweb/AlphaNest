'use client';

import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { JUPITER_API_URL, SOLANA_TOKEN_DECIMALS, SOLANA_TOKENS } from '@/config/solana';

interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  routePlan: {
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }[];
  otherAmountThreshold: string;
  swapMode: string;
}

interface SwapParams {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
}

export function useJupiterSwap() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // 获取报价
  const fetchQuote = useCallback(async (params: SwapParams) => {
    if (!params.inputMint || !params.outputMint || !params.amount) {
      return null;
    }

    setIsLoadingQuote(true);
    setError(null);

    try {
      const inputDecimals = SOLANA_TOKEN_DECIMALS[params.inputMint] || 9;
      const amountInSmallestUnit = Math.floor(
        parseFloat(params.amount) * Math.pow(10, inputDecimals)
      ).toString();

      const queryParams = new URLSearchParams({
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: amountInSmallestUnit,
        slippageBps: (params.slippageBps || 50).toString(), // 默认 0.5%
      });

      const response = await fetch(`${JUPITER_API_URL}/quote?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to get quote');
      }

      const quoteData = await response.json();
      setQuote(quoteData);
      setIsLoadingQuote(false);
      return quoteData;
    } catch (err) {
      console.error('Jupiter quote error:', err);
      setError('Failed to get quote');
      setIsLoadingQuote(false);
      return null;
    }
  }, []);

  // 执行交换
  const executeSwap = useCallback(async () => {
    if (!quote || !publicKey || !signTransaction || !connected) {
      setError('Wallet not connected');
      return null;
    }

    setIsSwapping(true);
    setError(null);

    try {
      // 获取交换交易
      const swapResponse = await fetch(`${JUPITER_API_URL}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      });

      if (!swapResponse.ok) {
        throw new Error('Failed to get swap transaction');
      }

      const { swapTransaction } = await swapResponse.json();

      // 反序列化交易
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // 签名交易
      const signedTransaction = await signTransaction(transaction);

      // 发送交易
      const rawTransaction = signedTransaction.serialize();
      const signature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });

      // 确认交易
      await connection.confirmTransaction(signature, 'confirmed');

      setTxSignature(signature);
      setIsSwapping(false);
      return signature;
    } catch (err) {
      console.error('Jupiter swap error:', err);
      setError('Swap failed');
      setIsSwapping(false);
      return null;
    }
  }, [quote, publicKey, signTransaction, connected, connection]);

  // 格式化输出金额
  const formatOutputAmount = useCallback((outAmount: string, outputMint: string) => {
    const decimals = SOLANA_TOKEN_DECIMALS[outputMint] || 9;
    return (parseInt(outAmount) / Math.pow(10, decimals)).toFixed(6);
  }, []);

  // 计算价格影响
  const getPriceImpact = useCallback(() => {
    if (!quote) return null;
    return parseFloat(quote.priceImpactPct);
  }, [quote]);

  return {
    quote,
    isLoadingQuote,
    isSwapping,
    error,
    txSignature,
    fetchQuote,
    executeSwap,
    formatOutputAmount,
    getPriceImpact,
    isConnected: connected,
    walletAddress: publicKey?.toString(),
  };
}

// Token 列表 Hook
export function useSolanaTokens() {
  const tokens = [
    { 
      address: SOLANA_TOKENS.SOL, 
      symbol: 'SOL', 
      name: 'Solana', 
      decimals: 9,
      logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
    },
    { 
      address: SOLANA_TOKENS.USDC, 
      symbol: 'USDC', 
      name: 'USD Coin', 
      decimals: 6,
      logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
    },
    { 
      address: SOLANA_TOKENS.USDT, 
      symbol: 'USDT', 
      name: 'Tether', 
      decimals: 6,
      logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png'
    },
    { 
      address: SOLANA_TOKENS.BONK, 
      symbol: 'BONK', 
      name: 'Bonk', 
      decimals: 5,
      logoUrl: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I'
    },
    { 
      address: SOLANA_TOKENS.WIF, 
      symbol: 'WIF', 
      name: 'dogwifhat', 
      decimals: 6,
      logoUrl: 'https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link'
    },
  ];

  return { tokens };
}
