/**
 * API Client for AlphaNest Backend
 */

// Use remote API by default, even if NEXT_PUBLIC_API_URL is set to localhost
const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
const API_URL = (envApiUrl && !envApiUrl.includes('localhost')) 
  ? envApiUrl 
  : 'https://alphanest-api.dappweb.workers.dev';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: 'Network error' };
  }
}

// ============================================
// Token APIs
// ============================================

export interface Token {
  id: string;
  address: string;
  chain: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl?: string;
  priceUsd: string;
  priceChange24h: number;
  volume24h: string;
  marketCap: string;
  liquidity: string;
  holderCount: number;
  creatorDevId?: string;
  status: 'active' | 'graduated' | 'rugged' | 'dead';
}

export async function getTokens(params?: {
  chain?: string;
  status?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<Token[]>> {
  const searchParams = new URLSearchParams();
  if (params?.chain) searchParams.set('chain', params.chain);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  return fetchApi<Token[]>(`/api/v1/tokens?${searchParams.toString()}`);
}

export async function getToken(address: string): Promise<ApiResponse<Token>> {
  return fetchApi<Token>(`/api/v1/tokens/${address}`);
}

export async function getTrendingTokens(chain?: string): Promise<ApiResponse<Token[]>> {
  const params = chain ? `?chain=${chain}` : '';
  return fetchApi<Token[]>(`/api/v1/tokens/trending${params}`);
}

// ============================================
// Dev APIs
// ============================================

export interface Dev {
  id: string;
  address: string;
  chain: string;
  alias?: string;
  score: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  totalLaunches: number;
  successfulLaunches: number;
  rugCount: number;
  totalVolume: string;
  avgAthMultiplier: number;
  verified: boolean;
  createdAt: number;
  updatedAt: number;
}

export async function getDevs(params?: {
  chain?: string;
  tier?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<Dev[]>> {
  const searchParams = new URLSearchParams();
  if (params?.chain) searchParams.set('chain', params.chain);
  if (params?.tier) searchParams.set('tier', params.tier);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  return fetchApi<Dev[]>(`/api/v1/devs?${searchParams.toString()}`);
}

export async function getDev(address: string): Promise<ApiResponse<Dev>> {
  return fetchApi<Dev>(`/api/v1/devs/${address}`);
}

export async function getDevTokens(address: string): Promise<ApiResponse<Token[]>> {
  return fetchApi<Token[]>(`/api/v1/devs/${address}/tokens`);
}

// ============================================
// User APIs
// ============================================

export interface User {
  id: string;
  primaryAddress: string;
  primaryChain: string;
  points: number;
  tier: string;
  createdAt: number;
}

export interface ConnectRequest {
  address: string;
  chain: string;
  signature: string;
  message: string;
}

export interface ConnectResponse {
  user: User;
  token: string;
  isNewUser: boolean;
}

export async function connectWallet(
  data: ConnectRequest
): Promise<ApiResponse<ConnectResponse>> {
  return fetchApi<ConnectResponse>('/api/v1/user/connect', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getUserProfile(
  token: string
): Promise<ApiResponse<User>> {
  return fetchApi<User>('/api/v1/user/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ============================================
// Insurance APIs
// ============================================

export interface InsuranceProduct {
  id: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  premiumRate: number;
  poolSize: string;
  currentOdds: { rug: number; safe: number };
  expiresAt: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface InsurancePolicy {
  id: string;
  userId: string;
  productId: string;
  tokenAddress: string;
  position: 'rug' | 'safe';
  premiumPaid: string;
  coverageAmount: string;
  potentialPayout: string;
  status: 'active' | 'claimed' | 'expired';
  expiresAt: number;
  createdAt: number;
}

export async function getInsuranceProducts(): Promise<ApiResponse<InsuranceProduct[]>> {
  return fetchApi<InsuranceProduct[]>('/api/v1/insurance/products');
}

export async function getUserPolicies(
  token: string
): Promise<ApiResponse<InsurancePolicy[]>> {
  return fetchApi<InsurancePolicy[]>('/api/v1/insurance/policies', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function purchaseInsurance(
  token: string,
  data: {
    productId: string;
    position: 'rug' | 'safe';
    amount: string;
  }
): Promise<ApiResponse<InsurancePolicy>> {
  return fetchApi<InsurancePolicy>('/api/v1/insurance/purchase', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

// ============================================
// Notification APIs
// ============================================

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
}

export async function getNotifications(
  token: string
): Promise<ApiResponse<Notification[]>> {
  return fetchApi<Notification[]>('/api/v1/notifications', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function markNotificationRead(
  token: string,
  notificationId: string
): Promise<ApiResponse<void>> {
  return fetchApi<void>(`/api/v1/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
