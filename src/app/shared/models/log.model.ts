// src/app/shared/models/log.model.ts

/**
 * Log (Nhật ký)
 * Lưu trữ các lần ghi nhận tiến độ cho một mục tiêu
 */
export interface Log {
  key: string;       // UUID do client sinh — định danh công khai
  goalKey: string;   // key của Goal
  value: number;
  date: string;      // YYYY-MM-DD
  note?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  syncStatus?: 'synced' | 'pending' | 'error';
}
