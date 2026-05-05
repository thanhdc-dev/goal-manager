import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { GoalService } from '../../core/services/goal.service';
import { LogService } from '../../core/services/log.service';
import { CalculationService } from '../../core/services/calculation.service';
import { Goal, GoalStats } from '../../shared/models/goal.model';
import { Log } from '../../shared/models/log.model';
import { ProgressChartComponent } from '../../components/progress-chart/progress-chart.component';
import { LogFormComponent } from '../../components/log-form/log-form.component';
import { GoalFormComponent } from '../../components/goal-form/goal-form.component';

@Component({
  selector: 'app-goal-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProgressChartComponent, LogFormComponent, GoalFormComponent],
  templateUrl: './goal-detail.component.html',
  styleUrls: ['./goal-detail.component.scss']
})
export class GoalDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly goalService = inject(GoalService);
  private readonly logService = inject(LogService);
  private readonly calcService = inject(CalculationService);

  goal = signal<Goal | null>(null);
  logs = signal<Log[]>([]);
  stats = signal<GoalStats | null>(null);
  predictionMsg = signal('');

  showLogForm = signal(false);
  editingLog = signal<Log | null>(null);
  showEditGoalForm = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    const goal = this.goalService.getById(id);
    if (goal) {
      this.goal.set(goal);
      this.refresh();
    }
  }

  refresh(): void {
    const goal = this.goal();
    if (!goal) return;
    const logs = this.logService.getByGoalId(goal.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.logs.set(logs);
    const stats = this.calcService.computeStats(goal, logs);
    this.stats.set(stats);
    this.predictionMsg.set(this.calcService.getPredictionMessage(goal, stats));
  }

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

  onLogSaved(): void {
    this.closeLogForm();
    this.refresh();
  }

  openEditGoal(): void {
    this.showEditGoalForm.set(true);
  }

  closeEditGoal(): void {
    this.showEditGoalForm.set(false);
  }

  onGoalSaved(): void {
    const id = this.goal()!.id;
    const updated = this.goalService.getById(id);
    if (updated) {
      this.goal.set(updated);
      this.refresh();
    }
    this.closeEditGoal();
  }

  deleteLog(log: Log): void {
    if (confirm('Xóa log này?')) {
      this.logService.delete(log.id);
      this.refresh();
    }
  }

  get periodLabel(): string {
    return this.goal()?.accumulationType === 'daily' ? 'ngày' : 'tháng';
  }

  get statusEmoji(): string {
    const s = this.stats()?.status;
    const map: Record<string, string> = {
      ahead: '🟢', 'on-track': '🟡', behind: '🔴',
      completed: '✅', expired: '⌛'
    };
    return s ? (map[s] ?? '') : '';
  }

  get statusLabel(): string {
    const s = this.stats()?.status;
    const map: Record<string, string> = {
      ahead: 'Vượt kế hoạch', 'on-track': 'Đúng kế hoạch',
      behind: 'Chậm tiến độ', completed: 'Hoàn thành', expired: 'Hết hạn'
    };
    return s ? (map[s] ?? '') : '';
  }

  fmt(n: number): string {
    return this.calcService.formatNumber(n);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }
}

