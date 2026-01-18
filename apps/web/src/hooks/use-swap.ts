'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSendTransaction } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
// Mock DEX aggregator types
interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  price: string;
  gasEstimate: string;
  estimatedGas: string;
  allowanceTarget: string;
  to: string;
  data: string;
  value: string;
  routes: any[];
}

interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number;
  userAddress: string;
}

// ERC20 ABI for approval
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
}

export interface SwapState {
  sellToken: TokenInfo | null;
  buyToken: TokenInfo | null;
  sellAmount: string;
  buyAmount: string;
  slippage: number;
  quote: SwapQuote | null;
  quoteSource: '0x' | '1inch' | null;
  isLoadingQuote: boolean;
  error: string | null;
}

const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export function useSwap(chainId: number) {
  const { address } = useAccount();
  const [state, setState] = useState<SwapState>({
    sellToken: null,
    buyToken: null,
    sellAmount: '',
    buyAmount: '',
    slippage: 0.5,
    quote: null,
    quoteSource: null,
    isLoadingQuote: false,
    error: null,
  });

  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { sendTransaction, data: swapHash } = useSendTransaction();

  const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isSwapping, isSuccess: isSwapSuccess } = useWaitForTransactionReceipt({
    hash: swapHash,
  });

  // Check allowance for sell token
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: state.sellToken?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && state.quote?.allowanceTarget
      ? [address, state.quote.allowanceTarget as `0x${string}`]
      : undefined,
    query: {
      enabled: !!state.sellToken && state.sellToken.address !== ETH_ADDRESS && !!state.quote?.allowanceTarget,
    },
  });

  // Get sell token balance
  const { data: sellTokenBalance } = useReadContract({
    address: state.sellToken?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!state.sellToken && state.sellToken.address !== ETH_ADDRESS && !!address,
    },
  });

  // Set sell token
  const setSellToken = useCallback((token: TokenInfo | null) => {
    setState((prev) => ({
      ...prev,
      sellToken: token,
      quote: null,
      buyAmount: '',
    }));
  }, []);

  // Set buy token
  const setBuyToken = useCallback((token: TokenInfo | null) => {
    setState((prev) => ({
      ...prev,
      buyToken: token,
      quote: null,
      buyAmount: '',
    }));
  }, []);

  // Set sell amount
  const setSellAmount = useCallback((amount: string) => {
    setState((prev) => ({
      ...prev,
      sellAmount: amount,
      quote: null,
      buyAmount: '',
    }));
  }, []);

  // Set slippage
  const setSlippage = useCallback((slippage: number) => {
    setState((prev) => ({ ...prev, slippage }));
  }, []);

  // Swap tokens
  const swapTokens = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sellToken: prev.buyToken,
      buyToken: prev.sellToken,
      sellAmount: prev.buyAmount,
      buyAmount: prev.sellAmount,
      quote: null,
    }));
  }, []);

  // Fetch quote
  const fetchQuote = useCallback(async () => {
    if (!state.sellToken || !state.buyToken || !state.sellAmount || parseFloat(state.sellAmount) <= 0) {
      return;
    }

    setState((prev) => ({ ...prev, isLoadingQuote: true, error: null }));

    try {
      const sellAmountWei = parseUnits(state.sellAmount, state.sellToken.decimals).toString();

      const params: SwapParams = {
        fromToken: state.sellToken.address,
        toToken: state.buyToken.address,
        amount: sellAmountWei.toString(),
        slippage: state.slippage,
        userAddress: address || '',
      };

      // Mock quote result
      const result: SwapQuote = {
        fromToken: state.sellToken.address,
        toToken: state.buyToken.address,
        fromAmount: sellAmountWei.toString(),
        toAmount: ((BigInt(sellAmountWei) * BigInt(995)) / BigInt(1000)).toString(), // 0.5% slippage
        price: '1.0',
        gasEstimate: '200000',
        estimatedGas: '200000',
        allowanceTarget: state.sellToken.address,
        to: '0x0000000000000000000000000000000000000000',
        data: '0x',
        value: '0',
        routes: []
      };

      if (result) {
        const buyAmountFormatted = formatUnits(BigInt(result.toAmount), state.buyToken.decimals);
        setState((prev) => ({
          ...prev,
          quote: result,
          quoteSource: '0x',
          buyAmount: buyAmountFormatted,
          isLoadingQuote: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: 'Unable to get quote. Try a different amount or token pair.',
          isLoadingQuote: false,
        }));
      }
    } catch (error) {
      console.error('Quote error:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to fetch quote',
        isLoadingQuote: false,
      }));
    }
  }, [state.sellToken, state.buyToken, state.sellAmount, state.slippage, address, chainId]);

  // Check if approval needed
  const needsApproval = useCallback(() => {
    if (!state.sellToken || state.sellToken.address === ETH_ADDRESS) return false;
    if (!state.quote || !allowance) return false;

    const sellAmountWei = parseUnits(state.sellAmount, state.sellToken.decimals);
    return allowance < sellAmountWei;
  }, [state.sellToken, state.sellAmount, state.quote, allowance]);

  // Approve token
  const approveToken = useCallback(async () => {
    if (!state.sellToken || !state.quote?.allowanceTarget) return;

    const sellAmountWei = parseUnits(state.sellAmount, state.sellToken.decimals);

    approve({
      address: state.sellToken.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [state.quote.allowanceTarget as `0x${string}`, sellAmountWei],
    });
  }, [state.sellToken, state.sellAmount, state.quote, approve]);

  // Execute swap using the quote data
  const executeSwap = useCallback(async () => {
    if (!state.quote || !address) return;
    
    try {
      sendTransaction({
        to: state.quote.to as `0x${string}`,
        data: state.quote.data as `0x${string}`,
        value: BigInt(state.quote.value || '0'),
      });
    } catch (error) {
      console.error('Swap execution failed:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to execute swap',
      }));
    }
  }, [state.quote, address, sendTransaction]);

  // Refetch allowance after approval
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Calculate price impact
  const priceImpact = useCallback(() => {
    if (!state.quote || !state.sellAmount || !state.buyAmount) return null;

    const sellValue = parseFloat(state.sellAmount);
    const buyValue = parseFloat(state.buyAmount);
    const price = parseFloat(state.quote.price);

    if (sellValue === 0 || price === 0) return null;

    const expectedBuyValue = sellValue * price;
    const impact = ((expectedBuyValue - buyValue) / expectedBuyValue) * 100;

    return impact;
  }, [state.quote, state.sellAmount, state.buyAmount]);

  return {
    ...state,
    setSellToken,
    setBuyToken,
    setSellAmount,
    setSlippage,
    swapTokens,
    fetchQuote,
    needsApproval,
    approveToken,
    executeSwap,
    isApproving,
    isSwapping,
    isApproveSuccess,
    isSwapSuccess,
    priceImpact,
    sellTokenBalance: sellTokenBalance
      ? formatUnits(sellTokenBalance, state.sellToken?.decimals || 18)
      : '0',
    approveHash,
    swapHash,
  };
}
