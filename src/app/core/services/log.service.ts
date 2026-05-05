// src/app/core/services/log.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { Log } from '../../shared/models/log.model';

const STORAGE_KEY = 'gm_logs';

@Injectable({ providedIn: 'root' })
export class LogService {
  private _logs = signal<Log[]>(this.load());

  readonly logs = this._logs.asReadonly();

  // Computed: Lọc logs theo goalId (Tối ưu: chỉ tính toán khi goalId thay đổi)
  // Lưu ý: Trong thực tế, nếu có nhiều goal, nên dùng một Map hoặc tính toán trong component
  // Nhưng để đơn giản, ta dùng computed với một tham số động (không được trong signal thuần)
  // Giải pháp: Tạo một hàm getter hoặc dùng computed trong component.

  // Tuy nhiên, để tối ưu hiệu suất khi render danh sách logs, ta sẽ không filter toàn bộ logs ở đây
  // mà để component tự filter dựa trên goalId hiện tại.

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

  // Hàm helper để lấy logs của một goal cụ thể (nên dùng trong component)
  getByGoalId(goalId: string): Log[] {
    return this._logs().filter(l => l.goalId === goalId);
  }

  create(data: Omit<Log, 'id' | 'createdAt'>): Log {
    const log: Log = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...this._logs(), log];
    this._logs.set(updated);
    this.save(updated);
    return log;
  }

  update(id: string, data: Partial<Omit<Log, 'id' | 'createdAt'>>): void {
    const updated = this._logs().map(l =>
      l.id === id ? { ...l, ...data } : l
    );
    this._logs.set(updated);
    this.save(updated);
  }

  delete(id: string): void {
    const updated = this._logs().filter(l => l.id !== id);
    this._logs.set(updated);
    this.save(updated);
  }

  deleteByGoalId(goalId: string): void {
    const updated = this._logs().filter(l => l.goalId !== goalId);
    this._logs.set(updated);
    this.save(updated);
  }
}

