import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { GoalService } from '../../core/services/goal.service';
import { LogService } from '../../core/services/log.service';
import { CalculationService } from '../../core/services/calculation.service';
import { Log } from '../../shared/models/log.model';
import { ProgressChartComponent } from '../../components/progress-chart/progress-chart.component';
import { LogFormComponent } from '../../components/log-form/log-form.component';
import { GoalFormComponent } from '../../components/goal-form/goal-form.component';

@Component({
  selector: 'app-goal-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProgressChartComponent, LogFormComponent, GoalFormComponent],
  templateUrl: './goal-detail.component.html',
})
export class GoalDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly goalService = inject(GoalService);
  private readonly logService = inject(LogService);
  private readonly calcService = inject(CalculationService);

  // --- State gốc: chỉ lưu goalId ---
  private readonly _goalId = signal<string | null>(null);

  // --- Derived state: tất cả đều là computed ---

  /** Goal object — tự cập nhật nếu goalService.goals thay đổi */
  readonly goal = computed(() => {
    const id = this._goalId();
    return id ? this.goalService.getById(id) ?? null : null;
  });

  /** Logs của goal này — tự cập nhật khi logService._logs thay đổi */
  readonly logs = computed(() => {
    const id = this._goalId();
    return id ? this.logService.getSignalByGoalId(id)() : [];
  });

  /** Stats — tự cập nhật khi goal hoặc logs thay đổi */
  readonly stats = computed(() => {
    const goal = this.goal();
    return goal ? this.calcService.computeStats(goal, this.logs()) : null;
  });

  /** Prediction message — tự cập nhật khi stats thay đổi */
  readonly predictionMsg = computed(() => {
    const goal = this.goal();
    const stats = this.stats();
    return goal && stats ? this.calcService.getPredictionMessage(goal, stats) : '';
  });

  readonly statusEmoji = computed(() => {
    const s = this.stats()?.status;
    const map: Record<string, string> = {
      ahead: '🟢', 'on-track': '🟡', behind: '🔴',
      completed: '✅', expired: '⌛'
    };
    return s ? (map[s] ?? '') : '';
  });

  readonly statusLabel = computed(() => {
    const s = this.stats()?.status;
    const map: Record<string, string> = {
      ahead: 'Vượt kế hoạch', 'on-track': 'Đúng kế hoạch',
      behind: 'Chậm tiến độ', completed: 'Hoàn thành', expired: 'Hết hạn'
    };
    return s ? (map[s] ?? '') : '';
  });

  readonly periodLabel = computed(() =>
    this.goal()?.accumulationType === 'daily' ? 'ngày' : 'tháng'
  );

  /**
   * Computed: CSS custom properties cho màu riêng của goal hiện tại.
   */
  readonly goalStyle = computed(() => {
    const color = this.goal()?.color;
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
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 40);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 40);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 40);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // --- UI state ---
  readonly showLogForm = signal(false);
  readonly editingLog = signal<Log | null>(null);
  readonly showEditGoalForm = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this._goalId.set(id);
  }

  // --- Log actions ---
  openAddLog(): void {
    this.editingLog.set(null);
    this.showLogForm.set(true);
  }

  openEditLog(log: Log): void {
    this.editingLog.set(log);
    this.showLogForm.set(true);
  }

  closeLogForm(): void {
    this.showLogForm.set(false);
    this.editingLog.set(null);
  }

  /** Không cần refresh() — computed signals tự cập nhật sau khi service thay đổi */
  onLogSaved(): void {
    this.closeLogForm();
  }

  deleteLog(log: Log): void {
    if (confirm('Xóa log này?')) {
      this.logService.delete(log.id);
      // stats tự tính lại vì logService._logs đã thay đổi
    }
  }

  // --- Goal actions ---
  openEditGoal(): void {
    this.showEditGoalForm.set(true);
  }

  closeEditGoal(): void {
    this.showEditGoalForm.set(false);
  }

  onGoalSaved(): void {
    this.closeEditGoal();
    // goal() tự cập nhật vì goalService.goals đã thay đổi
  }

  // --- Helpers ---
  fmt(n: number): string {
    return this.calcService.formatNumber(n);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }
}


