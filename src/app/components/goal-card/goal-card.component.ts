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
  styleUrls: ['./goal-card.component.scss']
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
}

