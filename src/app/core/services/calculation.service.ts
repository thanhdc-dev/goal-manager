import { Injectable } from "@angular/core";
import {
  Goal,
  GoalStats,
  MilestoneStatus,
  ProgressStatus,
} from "../../shared/models/goal.model";
import { Log } from "../../shared/models/log.model";

@Injectable({ providedIn: "root" })
export class CalculationService {
  // Cache đơn giản để tránh tính toán lại nếu logs không đổi (tùy chọn, nhưng tốt cho danh sách dài)
  private readonly statsCache = new Map<
    string,
    { goalKey: string; logsHash: string; stats: GoalStats }
  >();

  computeStats(goal: Goal, logs: Log[]): GoalStats {
    // Tạo hash đơn giản từ logs để kiểm tra cache (tối ưu cho danh sách logs lớn)
    const logsHash = logs.map((l) => `${l.key}-${l.value}-${l.date}`).join("|");
    // Bao gồm các field goal ảnh hưởng tính toán để invalidate cache khi edit
    const goalSnapshot = `${goal.targetValue}-${goal.endDate}-${goal.startDate}-${goal.valueType}-${goal.accumulationType}`;
    const cacheKey = `${goal.key}-${goalSnapshot}-${logsHash}`;

    if (this.statsCache.has(cacheKey)) {
      return this.statsCache.get(cacheKey)!.stats;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const start = new Date(goal.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(goal.endDate);
    end.setHours(0, 0, 0, 0);

    // 1. Current value (Tối ưu: dùng reduce một lần)
    const currentValue = logs.reduce((sum, l) => sum + l.value, 0);

    // 2. Progress %
    const progress =
      goal.targetValue > 0
        ? Math.min(100, (currentValue / goal.targetValue) * 100)
        : 0;

    // 3. Remaining
    const remaining = Math.max(0, goal.targetValue - currentValue);

    // 4. Remaining periods (Tối ưu: tính toán nhanh hơn)
    const remainingPeriods = this.getRemainingPeriods(goal, now, end);

    // 5. Required per period
    const requiredPerPeriodRaw = Math.max(0, remaining / remainingPeriods);
    const requiredPerPeriod =
      goal.valueType === "integer"
        ? Math.ceil(requiredPerPeriodRaw)
        : requiredPerPeriodRaw;

    // 6. Expected progress
    const expectedProgress = this.getExpectedProgress(goal, now, start, end);

    // 7. Avg & expected value
    const elapsedPeriods = this.getElapsedPeriods(goal, start, now);
    const avgPerPeriod = Math.max(0, currentValue / elapsedPeriods);
    const totalPeriods = this.getTotalPeriods(goal, start, end);
    const predictedTotal = avgPerPeriod * totalPeriods;

    // 8. Expected value at current time (giá trị kỳ vọng cần đạt tại thời điểm hiện tại)
    const expectedValueRaw = (expectedProgress / 100) * goal.targetValue;
    const expectedValue =
      goal.valueType === "integer"
        ? Math.round(expectedValueRaw)
        : expectedValueRaw;

    // 9. Status
    const isExpired = now > end;
    const isCompleted = remaining <= 0;
    const status = this.getStatus(
      progress,
      expectedProgress,
      isExpired,
      isCompleted,
    );

    // 10. Milestones (Tối ưu: chỉ tạo mảng nếu cần hiển thị)
    const milestones = this.getMilestones(currentValue, goal.targetValue);

    // 11. Streak (Tối ưu: dùng Set để kiểm tra nhanh)
    const streak = this.computeStreak(goal, logs, now);

    const result: GoalStats = {
      currentValue,
      progress,
      remaining,
      totalPeriods,
      remainingPeriods,
      requiredPerPeriod,
      expectedProgress,
      status,
      predictedTotal,
      expectedValue,
      avgPerPeriod,
      streak,
      milestones,
      isExpired,
      isCompleted,
    };

    // Lưu vào cache (giới hạn kích thước cache nếu cần)
    this.statsCache.set(cacheKey, { goalKey: goal.key, logsHash, stats: result });

    // Giới hạn cache size (ví dụ: 50 mục tiêu gần nhất)
    if (this.statsCache.size > 50) {
      const firstKey = this.statsCache.keys().next().value;
      if (firstKey) {
        this.statsCache.delete(firstKey);
      }
    }

    return result;
  }

  private diffInDays(start: Date, end: Date): number {
    const startUTC = Date.UTC(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return (endUTC - startUTC) / (1000 * 60 * 60 * 24);
  }

  private diffInMonths(start: Date, end: Date): number {
    const yearsDiff = end.getFullYear() - start.getFullYear();
    const monthsDiff = end.getMonth() - start.getMonth();
    let total = yearsDiff * 12 + monthsDiff;

    if (end.getDate() > start.getDate()) {
      total += 1;
    }

    return Math.max(1, total);
  }

  private getRemainingPeriods(goal: Goal, now: Date, end: Date): number {
    if (now >= end) return 0;
    if (goal.accumulationType === "daily") {
      return this.diffInDays(now, end);
    }
    const start = new Date(goal.startDate);
    const totalPeriod = this.getTotalPeriods(goal, start, end);
    return totalPeriod - this.getElapsedPeriods(goal, start, new Date());
  }

  private getExpectedProgress(
    goal: Goal,
    now: Date,
    start: Date,
    end: Date,
  ): number {
    if (now <= start) return 0;
    if (goal.accumulationType === "daily") {
      const totalTime = this.diffInDays(start, end);
      if (totalTime <= 0) return 0;
      const timePassed = this.diffInDays(start, now);
      return Math.min(100, Math.max(0, (timePassed / totalTime) * 100));
    }
    const totalTime = this.diffInMonths(start, end);
    if (totalTime <= 0) return 0;
    const elapsedMonths = this.diffInMonths(start, now);
    return Math.min(100, Math.max(0, (elapsedMonths / totalTime) * 100));
  }

  private getElapsedPeriods(goal: Goal, start: Date, now: Date): number {
    if (now <= start) return 0;
    if (goal.accumulationType === "daily") {
      return this.diffInDays(start, now);
    }
    return this.diffInMonths(start, now);
  }

  private getTotalPeriods(goal: Goal, start: Date, end: Date): number {
    if (goal.accumulationType === "daily") {
      return this.diffInDays(start, end);
    }
    return this.diffInMonths(start, end);
  }

  private getStatus(
    progress: number,
    expectedProgress: number,
    isExpired: boolean,
    isCompleted: boolean,
  ): ProgressStatus {
    if (isCompleted) return "completed";
    if (isExpired) return "expired";
    if (progress >= expectedProgress) return "ahead";
    if (progress < expectedProgress) return "behind";
    return "on-track";
  }

  private getMilestones(
    currentValue: number,
    targetValue: number,
  ): MilestoneStatus[] {
    if (targetValue <= 0) return [];
    const milestones: MilestoneStatus[] = [];
    const thresholds = [25, 50, 75, 100];
    const currentPercent = (currentValue / targetValue) * 100;

    thresholds.forEach((percent) => {
      const reached = currentPercent >= percent;
      milestones.push({
        percent: percent as 25 | 50 | 75 | 100,
        reached,
        reachedAt: reached ? new Date().toISOString() : undefined,
      });
    });
    return milestones;
  }

  private computeStreak(goal: Goal, logs: Log[], today: Date): number {
    if (logs.length === 0) return 0;

    // Sắp xếp logs theo ngày giảm dần để kiểm tra streak nhanh hơn
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Tạo Set các ngày có log để kiểm tra nhanh O(1)
    const logDates = new Set(
      sortedLogs.map((l) => new Date(l.date).toDateString()),
    );

    let streak = 0;
    const cursor = new Date(today);

    // Kiểm tra ngày hôm nay, hôm qua, ...
    while (logDates.has(cursor.toDateString())) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Nếu là monthly
    if (goal.accumulationType === "monthly") {
      const logMonths = new Set(
        logs.map((l) => {
          const d = new Date(l.date);
          return `${d.getFullYear()}-${d.getMonth()}`;
        }),
      );
      const cursorMonth = new Date(today);
      let monthStreak = 0;
      while (
        logMonths.has(`${cursorMonth.getFullYear()}-${cursorMonth.getMonth()}`)
      ) {
        monthStreak++;
        cursorMonth.setMonth(cursorMonth.getMonth() - 1);
      }
      return monthStreak;
    }

    return streak;
  }

  getPredictionMessage(goal: Goal, stats: GoalStats): string {
    if (stats.isCompleted) return "Bạn đã hoàn thành mục tiêu!";
    if (stats.isExpired) return "Mục tiêu đã hết hạn.";

    const period = goal.accumulationType === "daily" ? "ngày" : "tháng";

    if (stats.requiredPerPeriod <= 0) {
      return `Bạn đã đạt mục tiêu trước thời hạn!`;
    }

    const willReach = stats.predictedTotal >= goal.targetValue;
    const reqFormatted = this.formatNumber(stats.requiredPerPeriod);
    const predFormatted = this.formatNumber(stats.predictedTotal);
    const expectedFormatted = this.formatNumber(stats.expectedValue);

    if (!willReach) {
      return `Với tốc độ hiện tại, bạn sẽ đạt <strong>${predFormatted} ${goal.unit}</strong> — KHÔNG đủ để đạt mục tiêu. Cần thêm <strong>${reqFormatted} ${goal.unit}/${period}</strong> để đi đúng lộ trình.`;
    }

    return `Bạn cần <strong>${reqFormatted} ${goal.unit}/${period}</strong> để đạt mục tiêu đúng hạn. Giá trị kỳ vọng hiện tại: <strong>${expectedFormatted} ${goal.unit}</strong>.`;
  }

  formatNumber(n: number): string {
    const hasDecimal = !Number.isInteger(n);
    return n.toLocaleString("vi-VN", {
      minimumFractionDigits: hasDecimal ? 1 : 0,
      maximumFractionDigits: hasDecimal ? 1 : 0,
    });
  }

  formatCompact(n: number): string {
    if (n === 0) return "0";
    const absN = Math.abs(n);

    // Định dạng rút gọn tiếng Việt (tỷ, tr, k)
    if (absN >= 1e9) {
      return this.trimDecimal(n / 1e9, 2) + " tỷ";
    }
    if (absN >= 1e6) {
      return this.trimDecimal(n / 1e6, 2) + " tr";
    }
    if (absN >= 1e3) {
      return this.trimDecimal(n / 1e3, 1) + " k";
    }

    return this.formatNumber(n);
  }

  private trimDecimal(val: number, maxDigits: number): string {
    return val.toLocaleString("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDigits,
    });
  }
}
