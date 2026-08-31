// src/app/shared/models/auth.model.ts

/** Provider đăng nhập OAuth v2 (api.thanhdc.dev) */
export type AuthProvider = 'google' | 'github' | 'zalo';

/** Thông tin user trả về từ API nội bộ api.thanhdc.dev */
export interface AuthUser {
  id: number;
  fullname: string;
  email: string;
  picture?: string;
}

/** Cặp token từ API */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Response GET /auth/{provider}/login-url */
export interface LoginUrlResponse {
  authUrl: string;
}

/** Response GET /auth/callback */
export interface AuthCallbackResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

/** Format lỗi chuẩn của API */
export interface ApiError {
  timestamp?: string;
  method?: string;
  path?: string;
  statusCode: number;
  code: string;
  error?: string | null;
}
