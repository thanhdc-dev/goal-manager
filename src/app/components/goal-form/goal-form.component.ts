import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Goal, AccumulationType, ValueType } from '../../shared/models/goal.model';
import { LogService } from '../../core/services/log.service';
import { GoalService } from '../../core/services/goal.service';

@Component({
  selector: 'app-goal-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goal-form.component.html',
  styleUrls: ['./goal-form.component.scss'],
})
export class GoalFormComponent implements OnInit {
  /** Truyền vào khi edit, để trống khi tạo mới */
  @Input() initialGoal?: Goal;

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly goalService = inject(GoalService);
  private readonly logService = inject(LogService);

  form = {
    name: '',
    targetValue: null as number | null,
    unit: '',
    valueType: 'integer' as ValueType,
    startDate: '',
    endDate: '',
    accumulationType: 'daily' as AccumulationType,
    description: '',
  };

  formError = '';

  get isEdit(): boolean {
    return !!this.initialGoal;
  }

  ngOnInit(): void {
    if (this.initialGoal) {
      const g = this.initialGoal;
      this.form = {
        name: g.name,
        targetValue: g.targetValue,
        unit: g.unit,
        valueType: g.valueType,
        startDate: g.startDate.split('T')[0],
        endDate: g.endDate.split('T')[0],
        accumulationType: g.accumulationType,
        description: g.description ?? '',
      };
    } else {
      this.form.startDate = new Date().toISOString().split('T')[0];
    }
  }

  submit(): void {
    this.formError = '';

    if (!this.form.name.trim()) { this.formError = 'Vui lòng nhập tên mục tiêu.'; return; }
    if (!this.form.targetValue || this.form.targetValue <= 0) { this.formError = 'Giá trị mục tiêu phải lớn hơn 0.'; return; }
    if (!this.form.unit.trim()) { this.formError = 'Vui lòng nhập đơn vị.'; return; }
    if (!this.form.startDate) { this.formError = 'Chọn ngày bắt đầu.'; return; }
    if (!this.form.endDate) { this.formError = 'Chọn ngày kết thúc.'; return; }
    if (this.form.endDate <= this.form.startDate) { this.formError = 'Ngày kết thúc phải sau ngày bắt đầu.'; return; }

    if (this.initialGoal && !this.validateEdit(this.initialGoal)) {
      return;
    }

    const data = {
      name: this.form.name.trim(),
      targetValue: this.form.targetValue,
      unit: this.form.unit.trim(),
      valueType: this.form.valueType,
      startDate: new Date(this.form.startDate + 'T00:00:00').toISOString(),
      endDate: new Date(this.form.endDate + 'T00:00:00').toISOString(),
      accumulationType: this.form.accumulationType,
      description: this.form.description.trim() || undefined,
    };

    if (this.initialGoal) {
      this.goalService.update(this.initialGoal.id, data);
    } else {
      this.goalService.create(data);
    }

    this.saved.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }

  private validateEdit(editing: Goal): boolean {
    const today = new Date().toISOString().split('T')[0];
    if (this.form.endDate < today) {
      this.formError = 'Ngày kết thúc không được đặt trước hôm nay.';
      return false;
    }
    const logs = this.logService.getByGoalId(editing.id);
    const currentValue = logs.reduce((sum, l) => sum + l.value, 0);
    if ((this.form.targetValue ?? 0) <= currentValue) {
      return confirm(
        `Giá trị mục tiêu mới (${this.form.targetValue}) ≤ giá trị đã tích lũy (${currentValue} ${this.form.unit}). Mục tiêu sẽ chuyển sang "Hoàn thành". Tiếp tục?`
      );
    }
    return true;
  }
}
