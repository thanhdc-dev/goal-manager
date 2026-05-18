import { Component, effect, inject, input, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { GoalService } from "../../core/services/goal.service";
import { LogService } from "../../core/services/log.service";
import { GoalCardComponent } from "../../components/goal-card/goal-card.component";
import { GoalFormComponent } from "../../components/goal-form/goal-form.component";
import { Goal } from "../../shared/models/goal.model";
import { ThemeService } from "../../core/services/theme.service";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule, GoalCardComponent, GoalFormComponent],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent {
  private readonly goalService = inject(GoalService);
  private readonly logService = inject(LogService);
  readonly themeService = inject(ThemeService);

  goals = this.goalService.goals;
  showForm = signal(false);
  editingGoal = signal<Goal | null>(null);
  action = input<string>();

  constructor() {
    effect(() => {
      const action = this.action();
      if (action === "add-goal") {
        this.openForm();
      }
    });
  }

  openForm(goal?: Goal): void {
    this.editingGoal.set(goal ?? null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingGoal.set(null);
  }

  deleteGoal(id: string): void {
    this.goalService.delete(id);
    this.logService.deleteByGoalId(id);
  }
}
