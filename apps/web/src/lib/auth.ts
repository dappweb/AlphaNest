/**
 * Authentication utilities
 * 提供认证相关的工具函数
 */

/**
 * 获取认证请求头
 * 用于需要认证的 API 请求
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 如果有认证 token，添加到请求头
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * 设置认证 token
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

/**
 * 清除认证 token
 */
export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

/**
 * 获取当前认证 token
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * 检查是否已认证
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
