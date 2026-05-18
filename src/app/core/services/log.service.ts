import { Injectable, Signal, signal, computed } from "@angular/core";
import { Log } from "../../shared/models/log.model";
import { SyncQueueService } from "./sync-queue.service";

const STORAGE_KEY = "gm_logs";

@Injectable({ providedIn: "root" })
export class LogService {
  private _logs = signal<Log[]>(this.load());

  constructor(private syncQueue: SyncQueueService) {}

  readonly logs = this._logs.asReadonly();

  /**
   * Computed Signal: Nhóm toàn bộ logs theo goalId thành một Map.
   * Được tính toán lại tự động mỗi khi `_logs` thay đổi.
   * Cho phép các component lấy logs reactive theo goalId mà không cần gọi thủ công.
   */
  readonly logsMap = computed<Map<string, Log[]>>(() => {
    const map = new Map<string, Log[]>();
    for (const log of this._logs()) {
      const existing = map.get(log.goalId) ?? [];
      map.set(log.goalId, [...existing, log]);
    }
    return map;
  });

  /**
   * Trả về một Computed Signal chứa danh sách logs (đã sắp xếp mới nhất trước)
   * của một goal cụ thể. Signal này tự cập nhật khi có log mới được thêm/sửa/xóa.
   */
  getSignalByGoalId(goalId: string): Signal<Log[]> {
    return computed(() =>
      (this.logsMap().get(goalId) ?? []).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    );
  }

  /** @deprecated Dùng getSignalByGoalId() để có reactivity đầy đủ */
  getByGoalId(goalId: string): Log[] {
    return this._logs().filter((l) => l.goalId === goalId);
  }

  private load(): Log[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private save(logs: Log[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }

  setAll(logs: Log[]): void {
    this._logs.set(logs);
    this.save(logs);
  }

  create(data: Omit<Log, "id" | "createdAt" | "updatedAt" | "syncStatus">): Log {
    const log: Log = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending'
    };
    this._logs.update((prev) => [...prev, log]);
    this.save(this._logs());

    this.syncQueue.enqueue({
      type: 'CREATE',
      entity: 'log',
      entityId: log.id,
      payload: log
    });

    return log;
  }

  update(id: string, data: Partial<Omit<Log, "id" | "createdAt" | "syncStatus">>): void {
    let updatedLog: Log | undefined;
    this._logs.update((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          updatedLog = { ...l, ...data, updatedAt: new Date().toISOString(), syncStatus: 'pending' };
          return updatedLog;
        }
        return l;
      }),
    );
    this.save(this._logs());

    if (updatedLog) {
      this.syncQueue.enqueue({
        type: 'UPDATE',
        entity: 'log',
        entityId: id,
        payload: updatedLog
      });
    }
  }

  delete(id: string): void {
    this._logs.update((prev) => prev.filter((l) => l.id !== id));
    this.save(this._logs());

    this.syncQueue.enqueue({
      type: 'DELETE',
      entity: 'log',
      entityId: id
    });
  }

  deleteByGoalId(goalId: string): void {
    const logsToDelete = this._logs().filter(l => l.goalId === goalId);
    this._logs.update((prev) => prev.filter((l) => l.goalId !== goalId));
    this.save(this._logs());

    logsToDelete.forEach(log => {
      this.syncQueue.enqueue({
        type: 'DELETE',
        entity: 'log',
        entityId: log.id
      });
    });
  }
}
