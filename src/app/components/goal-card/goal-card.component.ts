import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Goal } from '../../shared/models/goal.model';
import { LogService } from '../../core/services/log.service';
import { CalculationService } from '../../core/services/calculation.service';

@Component({
  selector: 'app-goal-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './goal-card.component.html',
})
export class GoalCardComponent {
  // Signal-based inputs (Angular 17+)
  readonly goal = input.required<Goal>();
  readonly deleteGoal = output<string>();
  readonly editGoal = output<Goal>();

  private readonly logService = inject(LogService);
  private readonly calcService = inject(CalculationService);

  /**
   * Computed Signal: Tự lấy logs của goal này từ LogService.
   * Tự động cập nhật khi có log mới được thêm/sửa/xóa ở bất kỳ đâu.
   */
  private readonly logs = computed(() =>
    this.logService.getSignalByGoalId(this.goal().id)()
  );

  /**
   * Computed Signal: Tự tính stats khi goal hoặc logs thay đổi.
   * Không cần gọi refresh() thủ công nữa.
   */
  readonly stats = computed(() =>
    this.calcService.computeStats(this.goal(), this.logs())
  );

  readonly predictionMsg = computed(() =>
    this.calcService.getPredictionMessage(this.goal(), this.stats())
  );

  readonly statusEmoji = computed(() => {
    const map: Record<string, string> = {
      ahead: '🟢', 'on-track': '🟡', behind: '🔴',
      completed: '✅', expired: '⌛'
    };
    return map[this.stats().status] ?? '⬜';
  });

  readonly statusLabel = computed(() => {
    const map: Record<string, string> = {
      ahead: 'Vượt kế hoạch', 'on-track': 'Đúng kế hoạch',
      behind: 'Chậm tiến độ', completed: 'Hoàn thành', expired: 'Hết hạn'
    };
    return map[this.stats().status] ?? '';
  });

  readonly periodLabel = computed(() =>
    this.goal().accumulationType === 'daily' ? 'ngày' : 'tháng'
  );

  readonly insightLabel = computed(() => {
    if (this.stats().status === 'completed') {
      return 'Trạng thái';
    }
    if (this.stats().status === 'expired') {
      return 'Trạng thái';
    }
    return this.goal().accumulationType === 'daily' ? 'Hôm nay cần' : 'Tháng tới cần';
  });

  readonly insightValue = computed(() => {
    if (this.stats().status === 'completed' || this.stats().remaining <= 0) {
      return 'Hoàn thành 🎉';
    }
    if (this.stats().status === 'expired') {
      return 'Đã hết hạn';
    }
    return `${this.fmt(this.stats().requiredPerPeriod)} ${this.goal().unit}`;
  });

  /**
   * Computed: CSS custom properties cho màu riêng của từng goal.
   * Được áp dụng qua [style] binding trên host element.
   */
  readonly goalStyle = computed(() => {
    const color = this.goal().color;
    if (!color) return {};
    return {
      '--goal-color': color,
      '--goal-color-soft': this.hexToRgba(color, 0.14),
      '--goal-color-light': this.lighten(color),
    };
  });

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  private lighten(hex: string): string {
    // Tăng lightness ~20% bằng cách pha trắng
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 40);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 40);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 40);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }

  onEdit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.editGoal.emit(this.goal());
  }

  onDelete(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (confirm(`Xóa mục tiêu "${this.goal().name}"?`)) {
      this.deleteGoal.emit(this.goal().id);
    }
  }

  fmt(n: number): string {
    return this.calcService.formatNumber(n);
  }

  fmtCompact(n: number): string {
    return this.calcService.formatCompact(n);
  }
}

