// src/app/shared/models/goal.model.ts

/** Loại tích lũy của mục tiêu */
export type AccumulationType = 'daily' | 'monthly';

/** Trạng thái tiến độ */
export type ProgressStatus = 'ahead' | 'on-track' | 'behind' | 'completed' | 'expired';
  
export type ValueType = 'integer' | 'decimal';

/**
 * Mục tiêu (Goal)
 * Lưu trữ thông tin chi tiết của một mục tiêu
 */
export interface Goal {
  id: string;
  name: string;
  targetValue: number;
  unit: string;
  valueType: ValueType;
  startDate: string; // ISO string (YYYY-MM-DD)
  endDate: string;   // ISO string (YYYY-MM-DD)
  accumulationType: AccumulationType;
  description?: string;
  createdAt: string; // ISO string
}

/** Trạng thái mốc cột (Milestone) */
export interface MilestoneStatus {
  percent: number; // 25 | 50 | 75 | 100
  reached: boolean;
  reachedAt?: string; // ISO string
}

/** Thống kê của mục tiêu (Tính toán từ CalculationService) */
export interface GoalStats {
  currentValue: number;
  progress: number;           // 0–100
  remaining: number;
  remainingPeriods: number;
  totalPeriods: number;       // Tổng số chu kỳ (ngày/tháng)
  requiredPerPeriod: number;
  expectedProgress: number;   // 0–100
  status: ProgressStatus;
  predictedTotal: number;
  expectedValue: number;      // Giá trị kỳ vọng cần đạt tại thời điểm hiện tại
  avgPerPeriod: number;
  streak: number;
  milestones: MilestoneStatus[];
  isExpired: boolean;
  isCompleted: boolean;
}


