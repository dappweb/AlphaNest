'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  getAdminInfo, 
  isAdminTokenExpired, 
  getCurrentAdmin,
  type AdminInfo 
} from '@/lib/admin-auth';

/**
 * Hook to check if current user is an admin
 * Returns true only if:
 * 1. Wallet is connected
 * 2. Admin token exists and is valid
 * 3. Admin info is confirmed from API
 */
export function useIsAdmin() {
  const { connected, publicKey } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoading(true);

      // Must have wallet connected
      if (!connected || !publicKey) {
        setIsAdmin(false);
        setAdminInfo(null);
        setIsLoading(false);
        return;
      }

      // Check if there is a valid admin token
      const info = getAdminInfo();
      if (!info || isAdminTokenExpired()) {
        setIsAdmin(false);
        setAdminInfo(null);
        setIsLoading(false);
        return;
      }

      // Verify admin status with API
      try {
        const currentAdmin = await getCurrentAdmin();
        if (currentAdmin && currentAdmin.wallet === publicKey.toBase58()) {
          setAdminInfo(currentAdmin);
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          setAdminInfo(null);
        }
      } catch (err) {
        console.error('Check admin status error:', err);
        setIsAdmin(false);
        setAdminInfo(null);
      }

      setIsLoading(false);
    };

    checkAdminStatus();

    // Re-check when wallet connection changes
    const interval = setInterval(checkAdminStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [connected, publicKey]);

  return {
    isAdmin,
    isLoading,
    adminInfo,
  };
}
