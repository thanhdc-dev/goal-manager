import { Injectable, signal, computed, inject } from "@angular/core";
import { Goal } from "../../shared/models/goal.model";
import { SyncQueueService } from "./sync-queue.service";

const STORAGE_KEY = "gm_goals";

@Injectable({ providedIn: "root" })
export class GoalService {
  private readonly syncQueue = inject(SyncQueueService);
  private _goals = signal<Goal[]>(this.load());

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
      const parsed = raw ? JSON.parse(raw) : [];
      // Bỏ dữ liệu format cũ (trước migration dùng `id` thay vì `key`)
      return Array.isArray(parsed)
        ? parsed.filter((g) => g && typeof g.key === "string")
        : [];
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

  getByKey(key: string): Goal | undefined {
    return this._goals().find((g) => g.key === key);
  }

  create(data: Omit<Goal, "key" | "createdAt" | "updatedAt" | "syncStatus">): Goal {
    const now = new Date().toISOString();
    const goal: Goal = {
      ...data,
      key: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    const updated = [...this._goals(), goal];
    this._goals.set(updated);
    this.save(updated);

    this.syncQueue.enqueue({
      type: 'CREATE',
      entity: 'goal',
      entityKey: goal.key,
      payload: goal
    });

    return goal;
  }

  update(key: string, data: Partial<Omit<Goal, "key" | "createdAt" | "syncStatus">>): void {
    let updatedGoal: Goal | undefined;
    const updated = this._goals().map((g) => {
      if (g.key === key) {
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
        entityKey: key,
        payload: updatedGoal
      });
    }
  }

  delete(key: string): void {
    const updated = this._goals().filter((g) => g.key !== key);
    this._goals.set(updated);
    this.save(updated);

    this.syncQueue.enqueue({
      type: 'DELETE',
      entity: 'goal',
      entityKey: key
    });
  }

  /** Xoá local không đẩy vào queue (dùng khi server đã xoá — 404). */
  removeLocal(key: string): void {
    const updated = this._goals().filter((g) => g.key !== key);
    this._goals.set(updated);
    this.save(updated);
  }
}
