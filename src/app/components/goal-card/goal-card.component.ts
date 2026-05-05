import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Goal, GoalStats } from '../../shared/models/goal.model';
import { LogService } from '../../core/services/log.service';
import { CalculationService } from '../../core/services/calculation.service';

@Component({
  selector: 'app-goal-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './goal-card.component.html',
  styleUrls: ['./goal-card.component.scss']
})
export class GoalCardComponent implements OnInit, OnChanges {
  @Input() goal!: Goal;
  @Output() deleteGoal = new EventEmitter<string>();
  @Output() editGoal = new EventEmitter<Goal>();

  private readonly logService = inject(LogService);
  private readonly calcService = inject(CalculationService);

  stats!: GoalStats;
  predictionMsg = '';

  ngOnInit(): void {
    this.refresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['goal'] && !changes['goal'].firstChange) {
      this.refresh();
    }
  }

  refresh(): void {
    const logs = this.logService.getByGoalId(this.goal.id);
    this.stats = this.calcService.computeStats(this.goal, logs);
    this.predictionMsg = this.calcService.getPredictionMessage(this.goal, this.stats);
  }

  get statusEmoji(): string {
    const map: Record<string, string> = {
      ahead: '🟢', 'on-track': '🟡', behind: '🔴',
      completed: '✅', expired: '⌛'
    };
    return map[this.stats.status] ?? '⬜';
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      ahead: 'Vượt kế hoạch', 'on-track': 'Đúng kế hoạch',
      behind: 'Chậm tiến độ', completed: 'Hoàn thành', expired: 'Hết hạn'
    };
    return map[this.stats.status] ?? '';
  }

  get periodLabel(): string {
    return this.goal.accumulationType === 'daily' ? 'ngày' : 'tháng';
  }

  onEdit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.editGoal.emit(this.goal);
  }

  onDelete(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (confirm(`Xóa mục tiêu "${this.goal.name}"?`)) {
      this.deleteGoal.emit(this.goal.id);
    }
  }

  fmt(n: number): string {
    return this.calcService.formatNumber(n);
  }
}
