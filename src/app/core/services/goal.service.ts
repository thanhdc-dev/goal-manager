import { Injectable, signal, computed } from "@angular/core";
import { Goal } from "../../shared/models/goal.model";
import { SyncQueueService } from "./sync-queue.service";

const STORAGE_KEY = "gm_goals";

@Injectable({ providedIn: "root" })
export class GoalService {
  private _goals = signal<Goal[]>(this.load());

  constructor(private syncQueue: SyncQueueService) {}

  // Signal chỉ đọc
  readonly goals = this._goals.asReadonly();

  // Computed: Lọc các mục tiêu đã hoàn thành hoặc hết hạn (tùy chọn, để tối ưu UI)
  readonly activeGoals = computed(() =>
    this._goals().filter((g) => {
      const end = new Date(g.endDate);
      end.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return now <= end; // Chỉ lấy mục tiêu chưa hết hạn
    }),
  );

  private load(): Goal[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private save(goals: Goal[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }

  setAll(goals: Goal[]): void {
    this._goals.set(goals);
    this.save(goals);
  }

  getById(id: string): Goal | undefined {
    return this._goals().find((g) => g.id === id);
  }

  create(data: Omit<Goal, "id" | "createdAt" | "updatedAt" | "syncStatus">): Goal {
    const goal: Goal = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending'
    };
    const updated = [...this._goals(), goal];
    this._goals.set(updated);
    this.save(updated);

    this.syncQueue.enqueue({
      type: 'CREATE',
      entity: 'goal',
      entityId: goal.id,
      payload: goal
    });

    return goal;
  }

  update(id: string, data: Partial<Omit<Goal, "id" | "createdAt" | "syncStatus">>): void {
    let updatedGoal: Goal | undefined;
    const updated = this._goals().map((g) => {
      if (g.id === id) {
        updatedGoal = { ...g, ...data, updatedAt: new Date().toISOString(), syncStatus: 'pending' };
        return updatedGoal;
      }
      return g;
    });
    
    this._goals.set(updated);
    this.save(updated);

    if (updatedGoal) {
      this.syncQueue.enqueue({
        type: 'UPDATE',
        entity: 'goal',
        entityId: id,
        payload: updatedGoal
      });
    }
  }

  delete(id: string): void {
    const updated = this._goals().filter((g) => g.id !== id);
    this._goals.set(updated);
    this.save(updated);

    this.syncQueue.enqueue({
      type: 'DELETE',
      entity: 'goal',
      entityId: id
    });
  }
}
