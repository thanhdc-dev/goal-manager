import { Injectable, effect, signal, untracked } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { AuthService } from "./auth.service";
import { GoalService } from "./goal.service";
import { LogService } from "./log.service";
import { Goal } from "../../shared/models/goal.model";
import { Log } from "../../shared/models/log.model";
import { SyncQueueService, SyncAction } from "./sync-queue.service";
import { toObservable } from "@angular/core/rxjs-interop";
import { debounceTime, skip } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SyncService {
  readonly isSyncing = signal(false);
  readonly isOnline = signal(navigator.onLine);
  private isInitializing = true;
  private isInternalUpdate = false; // Khóa chặn vòng lặp

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private goalService: GoalService,
    private logService: LogService,
    private syncQueue: SyncQueueService,
  ) {
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
      await this.processQueue(userId);
    } finally {
      this.isSyncing.set(false);
      // Giữ khóa thêm 3 giây để vượt qua debounceTime(2000) của các watcher
      setTimeout(() => {
        this.isInternalUpdate = false;
      }, 3000);
    }
  }

  private async pushToCloud() {
    const userId = this.auth.user()?.id;
    if (!userId || this.isSyncing()) return;

    this.isSyncing.set(true);
    try {
      await this.processQueue(userId);
    } finally {
      this.isSyncing.set(false);
    }
  }

  private async processQueue(userId: string) {
    if (this.syncQueue.isEmpty()) return;

    const actions = this.syncQueue.getQueue();
    for (const action of actions) {
      try {
        await this.handleAction(action, userId);
        this.syncQueue.dequeue(action.id);
      } catch (error) {
        console.error("Error processing sync action:", error);
        // Tạm thời dừng nếu có lỗi nghiêm trọng (như mất mạng giữa chừng)
        if (!this.isOnline()) break;
      }
    }

    // Sau khi xử lý xong queue, cập nhật trạng thái các item local thành 'synced'
    this.updateLocalSyncStatus(userId);
  }

  private async handleAction(action: SyncAction, userId: string) {
    const table = action.entity === 'goal' ? 'goals' : 'logs';
    const mapper = action.entity === 'goal' ? this.mapLocalGoal : this.mapLocalLog;

    if (action.type === 'DELETE') {
      const { error } = await this.supabase.client
        .from(table)
        .delete()
        .eq('id', action.entityId)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      // CREATE or UPDATE
      const { error } = await this.supabase.client
        .from(table)
        .upsert({
          ...mapper(action.payload),
          user_id: userId
        });
      if (error) throw error;
    }
  }

  private updateLocalSyncStatus(userId: string) {
    // Chỉ cập nhật những mục đang có status 'pending' thành 'synced'
    const goals = this.goalService.goals().map(g => 
      g.syncStatus === 'pending' ? { ...g, syncStatus: 'synced' } as Goal : g
    );
    this.goalService["setAll"](goals);

    const logs = this.logService.logs().map(l => 
      l.syncStatus === 'pending' ? { ...l, syncStatus: 'synced' } as Log : l
    );
    this.logService["setAll"](logs);
  }

  private async syncGoals(userId: string) {
    // 1. Fetch remote goals
    const { data: remoteGoals, error } = await this.supabase.client
      .from("goals")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching remote goals:", error);
      return;
    }

    const localGoals = this.goalService.goals();
    const mergedGoals: Goal[] = [...localGoals];

    // 2. Merge logic
    remoteGoals?.forEach((remote: any) => {
      const localIndex = mergedGoals.findIndex((g) => g.id === remote.id);
      const remoteMapped: Goal = this.mapRemoteGoal(remote);

      if (localIndex === -1) {
        mergedGoals.push(remoteMapped);
      } else {
        const local = mergedGoals[localIndex];
        if (new Date(remoteMapped.updatedAt) > new Date(local.updatedAt)) {
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
    this.goalService["setAll"](finalGoals);
  }

  private async syncLogs(userId: string) {
    const { data: remoteLogs, error } = await this.supabase.client
      .from("logs")
      .select("*")
      .eq("user_id", userId);

    if (error) return;

    const localLogs = this.logService.logs();
    const mergedLogs: Log[] = [...localLogs];

    remoteLogs?.forEach((remote: any) => {
      const localIndex = mergedLogs.findIndex((l) => l.id === remote.id);
      const remoteMapped: Log = this.mapRemoteLog(remote);

      if (localIndex === -1) {
        mergedLogs.push(remoteMapped);
      } else {
        const local = mergedLogs[localIndex];
        if (new Date(remoteMapped.updatedAt) > new Date(local.updatedAt)) {
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
    this.logService["setAll"](finalLogs);
  }


  // Helpers to map between DB (snake_case) and App (camelCase)
  private mapRemoteGoal(r: any): Goal {
    return {
      id: r.id,
      name: r.name,
      targetValue: r.target_value,
      unit: r.unit,
      valueType: r.value_type,
      startDate: r.start_date,
      endDate: r.end_date,
      accumulationType: r.accumulation_type,
      description: r.description,
      color: r.color,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      userId: r.user_id,
    };
  }

  private mapLocalGoal(l: Goal) {
    return {
      id: l.id,
      name: l.name,
      target_value: l.targetValue,
      unit: l.unit,
      value_type: l.valueType,
      start_date: l.startDate,
      end_date: l.endDate,
      accumulation_type: l.accumulationType,
      description: l.description,
      color: l.color,
      updated_at: l.updatedAt,
    };
  }

  private mapRemoteLog(r: any): Log {
    return {
      id: r.id,
      goalId: r.goal_id,
      value: r.value,
      date: r.date,
      note: r.note,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      userId: r.user_id,
    };
  }

  private mapLocalLog(l: Log) {
    return {
      id: l.id,
      goal_id: l.goalId,
      value: l.value,
      date: l.date,
      note: l.note,
      updated_at: l.updatedAt,
    };
  }
}
