import { Injectable, effect, signal, untracked, inject } from "@angular/core";
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
 * Đồng bộ dữ liệu với api.thanhdc.dev (REST, camelCase).
 * Server xác định user qua Bearer token — không gửi user_id trong payload.
 * Offline queue + merge theo updatedAt được giữ nguyên.
 *
 * LƯU Ý: Hợp đồng REST goals/logs là GIẢ ĐỊNH — chỉnh lại khi có API thật.
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

    const userId = this.auth.user()?.id;
    if (!userId) {
      this.isSyncing.set(false);
      this.isInternalUpdate = false;
      return;
    }

    try {
      // 1. Pull changes from Cloud first
      await Promise.all([this.syncGoals(userId), this.syncLogs(userId)]);

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
    for (const action of actions) {
      try {
        await this.handleAction(action);
        this.syncQueue.dequeue(action.id);
      } catch (error) {
        console.error("Error processing sync action:", error);
        // Tạm thời dừng nếu có lỗi nghiêm trọng (như mất mạng giữa chừng)
        if (!this.isOnline()) break;
      }
    }

    // Sau khi xử lý xong queue, cập nhật trạng thái các item local thành 'synced'
    this.updateLocalSyncStatus();
  }

  private async handleAction(action: SyncAction) {
    if (action.entity === 'goal') {
      if (action.type === 'DELETE') {
        await this.api.deleteGoal(action.entityId);
      } else if (action.type === 'CREATE') {
        await this.api.createGoal(action.payload as Goal);
      } else {
        await this.api.updateGoal(action.entityId, action.payload as Goal);
      }
    } else {
      if (action.type === 'DELETE') {
        await this.api.deleteLog(action.entityId);
      } else if (action.type === 'CREATE') {
        await this.api.createLog(action.payload as Log);
      } else {
        await this.api.updateLog(action.entityId, action.payload as Log);
      }
    }
  }

  private updateLocalSyncStatus() {
    // Chỉ cập nhật những mục đang có status 'pending' thành 'synced'
    const goals = this.goalService.goals().map(g =>
      g.syncStatus === 'pending' ? { ...g, syncStatus: 'synced' } as Goal : g
    );
    this.goalService.setAll(goals);

    const logs = this.logService.logs().map(l =>
      l.syncStatus === 'pending' ? { ...l, syncStatus: 'synced' } as Log : l
    );
    this.logService.setAll(logs);
  }

  private async syncGoals(userId: number) {
    // 1. Fetch remote goals (server lọc theo user qua Bearer token)
    const remoteGoals = await this.api.getGoals();

    const localGoals = this.goalService.goals();
    const mergedGoals: Goal[] = [...localGoals];

    // 2. Merge logic (camelCase — đồng nhất với model)
    remoteGoals?.forEach((remote: Goal) => {
      const localIndex = mergedGoals.findIndex((g) => g.id === remote.id);
      const remoteMapped: Goal = { ...remote, userId };

      if (localIndex === -1) {
        mergedGoals.push(remoteMapped);
      } else {
        const local = mergedGoals[localIndex];
        if (new Date(remoteMapped.updatedAt).getTime() > new Date(local.updatedAt).getTime()) {
          mergedGoals[localIndex] = remoteMapped;
        }
      }
    });

    // 3. Update local state with merged data and assigned userId
    const finalGoals = mergedGoals.map((g) => ({
      ...g,
      userId,
      syncStatus: g.syncStatus || 'synced'
    }));
    this.goalService.setAll(finalGoals);
  }

  private async syncLogs(userId: number) {
    const remoteLogs = await this.api.getLogs();

    const localLogs = this.logService.logs();
    const mergedLogs: Log[] = [...localLogs];

    remoteLogs?.forEach((remote: Log) => {
      const localIndex = mergedLogs.findIndex((l) => l.id === remote.id);
      const remoteMapped: Log = { ...remote, userId };

      if (localIndex === -1) {
        mergedLogs.push(remoteMapped);
      } else {
        const local = mergedLogs[localIndex];
        if (new Date(remoteMapped.updatedAt).getTime() > new Date(local.updatedAt).getTime()) {
          mergedLogs[localIndex] = remoteMapped;
        }
      }
    });

    // 3. Update local state with assigned userId
    const finalLogs = mergedLogs.map((l) => ({
      ...l,
      userId,
      syncStatus: l.syncStatus || 'synced'
    }));
    this.logService.setAll(finalLogs);
  }
}
