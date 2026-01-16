/**
 * 管理员认证工具函数
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787/api/v1';

export interface AdminInfo {
  admin_id: string;
  wallet: string;
  role: string;
  permissions: string[];
  token: string;
  expires_at: number;
}

/**
 * 获取管理员 Token
 */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('alphanest_admin_token');
}

/**
 * 设置管理员 Token
 */
export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('alphanest_admin_token', token);
}

/**
 * 移除管理员 Token
 */
export function removeAdminToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('alphanest_admin_token');
  localStorage.removeItem('alphanest_admin_info');
}

/**
 * 保存管理员信息
 */
export function saveAdminInfo(info: AdminInfo): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('alphanest_admin_info', JSON.stringify(info));
  setAdminToken(info.token);
}

/**
 * 获取管理员信息
 */
export function getAdminInfo(): AdminInfo | null {
  if (typeof window === 'undefined') return null;
  const info = localStorage.getItem('alphanest_admin_info');
  if (!info) return null;
  try {
    return JSON.parse(info);
  } catch {
    return null;
  }
}

/**
 * 检查管理员 Token 是否过期
 */
export function isAdminTokenExpired(): boolean {
  const info = getAdminInfo();
  if (!info) return true;
  return Date.now() >= info.expires_at;
}

/**
 * 获取管理员认证头
 */
export function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * 管理员登录
 */
export async function adminLogin(
  walletAddress: string,
  chain: string,
  signature: string,
  message: string
): Promise<AdminInfo> {
  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      wallet_address: walletAddress,
      chain,
      signature,
      message,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Login failed');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'Login failed');
  }

  const adminInfo: AdminInfo = result.data;
  saveAdminInfo(adminInfo);
  return adminInfo;
}

/**
 * 管理员登出
 */
export async function adminLogout(): Promise<void> {
  const token = getAdminToken();
  
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/admin/logout`, {
        method: 'POST',
        headers: getAdminAuthHeaders(),
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  removeAdminToken();
}

/**
 * 获取当前管理员信息
 */
export async function getCurrentAdmin(): Promise<AdminInfo | null> {
  const token = getAdminToken();
  if (!token || isAdminTokenExpired()) {
    removeAdminToken();
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/me`, {
      headers: getAdminAuthHeaders(),
    });

    if (!response.ok) {
      removeAdminToken();
      return null;
    }

    const result = await response.json();
    if (!result.success) {
      removeAdminToken();
      return null;
    }

    const info = getAdminInfo();
    return info;
  } catch (error) {
    console.error('Get admin info error:', error);
    removeAdminToken();
    return null;
  }
}

/**
 * 检查管理员权限
 */
export async function checkAdminPermission(permission: string): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/check-permission?permission=${encodeURIComponent(permission)}`,
      {
        headers: getAdminAuthHeaders(),
      }
    );

    if (!response.ok) return false;

    const result = await response.json();
    return result.success && result.data?.has_permission === true;
  } catch (error) {
    console.error('Check permission error:', error);
    return false;
  }
}

/**
 * 检查管理员是否具有角色
 */
export function hasAdminRole(requiredRoles: string[]): boolean {
  const info = getAdminInfo();
  if (!info) return false;
  return requiredRoles.includes(info.role);
}

/**
 * 检查管理员是否具有权限
 */
export function hasAdminPermission(requiredPermissions: string[]): boolean {
  const info = getAdminInfo();
  if (!info) return false;

  // 超级管理员拥有所有权限
  if (info.role === 'super_admin') return true;

  // 检查是否具有所需权限
  return requiredPermissions.some(perm => 
    info.permissions.includes(perm) || 
    info.permissions.includes('*')
  );
}
