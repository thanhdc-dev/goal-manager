// src/app/shared/models/log.model.ts

/**
 * Log (Nhật ký)
 * Lưu trữ các lần ghi nhận tiến độ cho một mục tiêu
 */
export interface Log {
  id: string;
  goalId: string;
  value: number;
  date: string; // ISO string (YYYY-MM-DD)
  note?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  userId?: number;   // User ID (api.thanhdc.dev)
  syncStatus?: 'synced' | 'pending' | 'error';
}
