'use client';

import { useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import {
  createInitializeMint2Instruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { SOLANA_PROGRAM_IDS } from '@/config/solana';

export interface TokenCreationParams {
  name: string;
  symbol: string;
  totalSupply: number;
  decimals?: number;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

export function useSolanaTokenFactory() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 创建代币
  const createToken = useCallback(async (params: TokenCreationParams) => {
    if (!publicKey || !signTransaction || !connected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: 使用 TokenFactory 程序创建代币
      // const program = new Program(IDL, SOLANA_PROGRAM_IDS.TOKEN_FACTORY, provider);
      // const mintKeypair = Keypair.generate();
      // 
      // const tx = await program.methods
      //   .createToken(
      //     params.name,
      //     params.symbol,
      //     new BN(params.totalSupply * Math.pow(10, params.decimals || 9)),
      //     params.decimals || 9
      //   )
      //   .accounts({
      //     authority: publicKey,
      //     mint: mintKeypair.publicKey,
      //     tokenProgram: TOKEN_PROGRAM_ID,
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .signers([mintKeypair])
      //   .rpc();

      // 临时实现：创建基础 SPL Token
      const mintKeypair = new (await import('@solana/web3.js')).Keypair();
      const mint = mintKeypair.publicKey;

      const lamports = await getMinimumBalanceForRentExemptMint(connection);

      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMint2Instruction(
          mint,
          params.decimals || 9,
          publicKey, // mint authority
          publicKey  // freeze authority
        )
      );

      transaction.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.partialSign(mintKeypair);

      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 2,
      });

      await connection.confirmTransaction(signature, 'confirmed');

      return {
        mint: mint.toBase58(),
        signature,
        name: params.name,
        symbol: params.symbol,
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Token creation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signTransaction, connected, connection]);

  return {
    createToken,
    isLoading,
    error,
  };
}
