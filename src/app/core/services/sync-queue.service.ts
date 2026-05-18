import { Injectable } from '@angular/core';

export type EntityType = 'goal' | 'log';
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface SyncAction {
  id: string;
  type: ActionType;
  entity: EntityType;
  entityId: string;
  payload?: any;
  timestamp: string;
}

const QUEUE_STORAGE_KEY = 'gm_sync_queue';

@Injectable({
  providedIn: 'root'
})
export class SyncQueueService {
  private queue: SyncAction[] = this.loadQueue();

  private loadQueue(): SyncAction[] {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveQueue(): void {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
  }

  enqueue(action: Omit<SyncAction, 'id' | 'timestamp'>): void {
    const newAction: SyncAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    
    // Tối ưu hóa: Nếu đã có action cho entity này, có thể gộp hoặc ghi đè
    // Ví dụ: Nếu là UPDATE sau một CREATE, vẫn giữ là CREATE nhưng update payload
    // Để đơn giản, bản đầu tiên cứ thêm vào cuối hàng đợi
    this.queue.push(newAction);
    this.saveQueue();
  }

  getQueue(): SyncAction[] {
    return [...this.queue];
  }

  dequeue(actionId: string): void {
    this.queue = this.queue.filter(a => a.id !== actionId);
    this.saveQueue();
  }

  clear(): void {
    this.queue = [];
    this.saveQueue();
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }
}
