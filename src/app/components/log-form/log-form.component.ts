import { Component, Input, Output, EventEmitter, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Log } from "../../shared/models/log.model";
import { LogService } from "../../core/services/log.service";
import { ValueType } from "../../shared/models/goal.model";

@Component({
  selector: "app-log-form",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./log-form.component.html",
  styleUrls: ["./log-form.component.scss"],
})
export class LogFormComponent implements OnInit {
  @Input() goalId!: string;
  @Input() unit = "";
  @Input() valueType: ValueType = "integer";
  @Input() editLog?: Log;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly logService = inject(LogService);

  value: number | null = null;
  date = "";
  note = "";
  error = "";

  ngOnInit(): void {
    if (this.editLog) {
      this.value = this.editLog.value;
      this.date = this.editLog.date.split("T")[0];
      this.note = this.editLog.note ?? "";
    } else {
      this.date = new Date().toISOString().split("T")[0];
    }
  }

  isInteger() {
    return this.valueType === "integer";
  }

  onInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    // Cắt bỏ phần thập phân nếu valueType là integer
    console.log(this.isInteger())
    if (this.isInteger()) {
      if (input.value.includes(".")) {
        input.value = input.value.split(".")[0]; 
      }
      if (input.value.includes(",")) {
        input.value = input.value.split(",")[0];
      }
    }
  }

  submit(): void {
    this.error = "";
    if (!this.value || this.value <= 0) {
      this.error = "Vui lòng nhập giá trị lớn hơn 0.";
      return;
    }
    if (!this.date) {
      this.error = "Vui lòng chọn ngày.";
      return;
    }

    const dateISO = new Date(this.date + "T00:00:00").toISOString();

    if (this.editLog) {
      this.logService.update(this.editLog.id, {
        value: this.value,
        date: dateISO,
        note: this.note || undefined,
      });
    } else {
      this.logService.create({
        goalId: this.goalId,
        value: this.value,
        date: dateISO,
        note: this.note || undefined,
      });
    }
    this.saved.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
