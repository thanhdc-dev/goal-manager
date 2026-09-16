import { Injectable, Signal, signal, computed, inject } from "@angular/core";
import { Log } from "../../shared/models/log.model";
import { SyncQueueService } from "./sync-queue.service";

const STORAGE_KEY = "gm_logs";

@Injectable({ providedIn: "root" })
export class LogService {
  private readonly syncQueue = inject(SyncQueueService);
  private _logs = signal<Log[]>(this.load());

  readonly logs = this._logs.asReadonly();

  /**
   * Computed Signal: Nhóm toàn bộ logs theo goalKey thành một Map.
   * Được tính toán lại tự động mỗi khi `_logs` thay đổi.
   * Cho phép các component lấy logs reactive theo goalKey mà không cần gọi thủ công.
   */
  readonly logsMap = computed<Map<string, Log[]>>(() => {
    const map = new Map<string, Log[]>();
    for (const log of this._logs()) {
      const existing = map.get(log.goalKey) ?? [];
      map.set(log.goalKey, [...existing, log]);
    }
    return map;
  });

  /**
   * Trả về một Computed Signal chứa danh sách logs (đã sắp xếp mới nhất trước)
   * của một goal cụ thể. Signal này tự cập nhật khi có log mới được thêm/sửa/xóa.
   */
  getSignalByGoalKey(goalKey: string): Signal<Log[]> {
    return computed(() =>
      (this.logsMap().get(goalKey) ?? []).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    );
  }

  private load(): Log[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      // Bỏ dữ liệu format cũ (trước migration dùng `id`/`goalId`)
      return Array.isArray(parsed)
        ? parsed.filter((l) => l && typeof l.key === "string" && typeof l.goalKey === "string")
        : [];
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

  create(data: Omit<Log, "key" | "createdAt" | "updatedAt" | "syncStatus">): Log {
    const now = new Date().toISOString();
    const log: Log = {
      ...data,
      key: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    this._logs.update((prev) => [...prev, log]);
    this.save(this._logs());

    this.syncQueue.enqueue({
      type: 'CREATE',
      entity: 'log',
      entityKey: log.key,
      payload: log
    });

    return log;
  }

  update(key: string, data: Partial<Omit<Log, "key" | "createdAt" | "syncStatus">>): void {
    let updatedLog: Log | undefined;
    this._logs.update((prev) =>
      prev.map((l) => {
        if (l.key === key) {
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
        entityKey: key,
        payload: updatedLog
      });
    }
  }

  delete(key: string): void {
    this._logs.update((prev) => prev.filter((l) => l.key !== key));
    this.save(this._logs());

    this.syncQueue.enqueue({
      type: 'DELETE',
      entity: 'log',
      entityKey: key
    });
  }

  deleteByGoalKey(goalKey: string): void {
    const logsToDelete = this._logs().filter(l => l.goalKey === goalKey);
    this._logs.update((prev) => prev.filter((l) => l.goalKey !== goalKey));
    this.save(this._logs());

    logsToDelete.forEach(log => {
      this.syncQueue.enqueue({
        type: 'DELETE',
        entity: 'log',
        entityKey: log.key
      });
    });
  }

  /** Xoá local không đẩy vào queue (dùng khi server đã xoá — 404). */
  removeLocal(key: string): void {
    this._logs.update((prev) => prev.filter((l) => l.key !== key));
    this.save(this._logs());
  }

  /** Xoá local mọi log của một goal, không đẩy vào queue. */
  removeLocalByGoalKey(goalKey: string): void {
    this._logs.update((prev) => prev.filter((l) => l.goalKey !== goalKey));
    this.save(this._logs());
  }
}
