import { Injectable, effect, signal, untracked, inject } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { AuthService } from "./auth.service";
import { ApiService } from "./api.service";
import { GoalService } from "./goal.service";
import { LogService } from "./log.service";
import { Goal } from "../../shared/models/goal.model";
import { Log } from "../../shared/models/log.model";
import { SyncQueueService, SyncAction } from "./sync-queue.service";
import { toObservable } from "@angular/core/rxjs-interop";
import { debounceTime, skip } from "rxjs";

/**
 * Đồng bộ dữ liệu với api.thanhdc.dev (theo docs/backend-api-spec.md).
 * - Định danh `key` (UUID) do client sinh → không cần reconcile ID.
 * - Server xác định user qua Bearer token (không gửi userId).
 * - Goal CREATE luôn được xử lý trước Log CREATE (log tham chiếu `goalKey`).
 * - PUT/DELETE gặp 404 ⇒ bản ghi đã bị xoá ở nơi khác → bỏ khỏi local.
 */
@Injectable({
  providedIn: "root",
})
export class SyncService {
  readonly isSyncing = signal(false);
  readonly isOnline = signal(navigator.onLine);
  private isInitializing = true;
  private isInternalUpdate = false; // Khóa chặn vòng lặp

  private api = inject(ApiService);
  private auth = inject(AuthService);
  private goalService = inject(GoalService);
  private logService = inject(LogService);
  private syncQueue = inject(SyncQueueService);

  constructor() {
    // 1. Theo dõi trạng thái mạng
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.syncAll();
    });
    window.addEventListener('offline', () => this.isOnline.set(false));

    // 2. Tự động sync toàn bộ khi đăng nhập thành công
    effect(() => {
      const isAuthenticated = this.auth.isAuthenticated();
      const isOnline = this.isOnline();

      if (isAuthenticated && isOnline) {
        untracked(() => {
          this.syncAll().then(() => {
            setTimeout(() => this.isInitializing = false, 1000);
          });
        });
      }
    });

    // 3. Theo dõi thay đổi Goals để đẩy lên Cloud (Background Sync)
    toObservable(this.goalService.goals)
      .pipe(debounceTime(2000), skip(1))
      .subscribe(() => {
        if (!this.isInitializing && this.auth.isAuthenticated() && this.isOnline() && !this.isSyncing() && !this.isInternalUpdate) {
          this.pushToCloud();
        }
      });

    // 4. Theo dõi thay đổi Logs
    toObservable(this.logService.logs)
      .pipe(debounceTime(2000), skip(1))
      .subscribe(() => {
        if (!this.isInitializing && this.auth.isAuthenticated() && this.isOnline() && !this.isSyncing() && !this.isInternalUpdate) {
          this.pushToCloud();
        }
      });
  }

  async syncAll() {
    if (this.isSyncing()) return;

    this.isSyncing.set(true);
    this.isInternalUpdate = true; // Bắt đầu khóa

    if (!this.auth.user()?.id) {
      this.isSyncing.set(false);
      this.isInternalUpdate = false;
      return;
    }

    try {
      // 1. Pull changes from Cloud first
      await Promise.all([this.syncGoals(), this.syncLogs()]);

      // 2. Process pending local actions
      await this.processQueue();
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      this.isSyncing.set(false);
      // Giữ khóa thêm 3 giây để vượt qua debounceTime(2000) của các watcher
      setTimeout(() => {
        this.isInternalUpdate = false;
      }, 3000);
    }
  }

  private async pushToCloud() {
    if (this.isSyncing()) return;

    this.isSyncing.set(true);
    try {
      await this.processQueue();
    } catch (error) {
      console.error("Push error:", error);
    } finally {
      this.isSyncing.set(false);
    }
  }

  private async processQueue() {
    if (this.syncQueue.isEmpty()) return;

    const actions = this.syncQueue.getQueue();
    // Goal trước Log: log chỉ hợp lệ khi goal đã tồn tại trên server.
    const goalActions = actions.filter((a) => a.entity === 'goal');
    const logActions = actions.filter((a) => a.entity === 'log');

    const goalsOk = await this.runActions(goalActions);
    if (goalsOk) {
      await this.runActions(logActions);
    }

    this.updateLocalSyncStatus();
  }

  /** Trả về `false` nếu bị dừng giữa chừng do mất mạng. */
  private async runActions(actions: SyncAction[]): Promise<boolean> {
    for (const action of actions) {
      try {
        await this.handleAction(action);
        this.syncQueue.dequeue(action.id);
      } catch (error) {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          // Bản ghi đã bị xoá ở nơi khác → bỏ khỏi local + queue, không chặn action sau.
          this.removeLocal(action);
          this.syncQueue.dequeue(action.id);
          continue;
        }
        console.error("Error processing sync action:", error);
        // Dừng nếu mất mạng giữa chừng để thử lại sau
        if (!this.isOnline()) return false;
      }
    }
    return true;
  }

  private async handleAction(action: SyncAction) {
    if (action.entity === 'goal') {
      const goal = action.payload as Goal | undefined;
      if (action.type === 'DELETE') {
        await this.api.deleteGoal(action.entityKey);
      } else if (action.type === 'CREATE') {
        await this.api.createGoal(goal!);
      } else {
        await this.api.updateGoal(action.entityKey, goal!);
      }
    } else {
      const log = action.payload as Log | undefined;
      if (action.type === 'DELETE') {
        await this.api.deleteLog(action.entityKey);
      } else if (action.type === 'CREATE') {
        await this.api.createLog(log!);
      } else {
        await this.api.updateLog(action.entityKey, log!);
      }
    }
  }

  /** Dùng khi server trả 404: coi như bản ghi đã bị xoá. */
  private removeLocal(action: SyncAction) {
    if (action.entity === 'goal') {
      this.goalService.removeLocal(action.entityKey);
      this.logService.removeLocalByGoalKey(action.entityKey);
    } else {
      this.logService.removeLocal(action.entityKey);
    }
  }

  private updateLocalSyncStatus() {
    // Chỉ đánh dấu 'synced' cho item không còn trong queue (tránh đánh dấu nhầm khi còn action lỗi)
    const remaining = new Set(this.syncQueue.getQueue().map((a) => a.entityKey));

    const goals = this.goalService.goals().map((g) =>
      g.syncStatus === 'pending' && !remaining.has(g.key)
        ? ({ ...g, syncStatus: 'synced' } as Goal)
        : g
    );
    this.goalService.setAll(goals);

    const logs = this.logService.logs().map((l) =>
      l.syncStatus === 'pending' && !remaining.has(l.key)
        ? ({ ...l, syncStatus: 'synced' } as Log)
        : l
    );
    this.logService.setAll(logs);
  }

  private async syncGoals() {
    // Fetch remote goals (server lọc theo user qua Bearer token)
    const remoteGoals = await this.api.getGoals();

    const mergedGoals: Goal[] = [...this.goalService.goals()];

    // Merge theo `key`, giữ bản có `updatedAt` mới hơn
    remoteGoals?.forEach((remote: Goal) => {
      const localIndex = mergedGoals.findIndex((g) => g.key === remote.key);
      if (localIndex === -1) {
        mergedGoals.push(remote);
      } else if (new Date(remote.updatedAt).getTime() > new Date(mergedGoals[localIndex].updatedAt).getTime()) {
        mergedGoals[localIndex] = remote;
      }
    });

    this.goalService.setAll(mergedGoals.map((g) => ({
      ...g,
      syncStatus: g.syncStatus ?? 'synced',
    })));
  }

  private async syncLogs() {
    const remoteLogs = await this.api.getLogs();

    const mergedLogs: Log[] = [...this.logService.logs()];

    remoteLogs?.forEach((remote: Log) => {
      const localIndex = mergedLogs.findIndex((l) => l.key === remote.key);
      if (localIndex === -1) {
        mergedLogs.push(remote);
      } else if (new Date(remote.updatedAt).getTime() > new Date(mergedLogs[localIndex].updatedAt).getTime()) {
        mergedLogs[localIndex] = remote;
      }
    });

    this.logService.setAll(mergedLogs.map((l) => ({
      ...l,
      syncStatus: l.syncStatus ?? 'synced',
    })));
  }
}
