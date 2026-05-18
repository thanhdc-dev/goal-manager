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
  userId?: string;   // Supabase User ID
  syncStatus?: 'synced' | 'pending' | 'error';
}
