import { Injectable, signal, computed, effect } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'gm_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Signal lưu trữ theme hiện tại */
  private readonly _mode = signal<ThemeMode>(this.loadSaved());

  /** Public readonly signal */
  readonly mode = this._mode.asReadonly();
  readonly isDark = computed(() => this._mode() === 'dark');

  constructor() {
    // Tự động cập nhật data-theme trên <html> khi mode thay đổi
    effect(() => {
      const mode = this._mode();
      document.documentElement.setAttribute('data-theme', mode);
      localStorage.setItem(STORAGE_KEY, mode);
    });
  }

  toggle(): void {
    this._mode.update(m => m === 'dark' ? 'light' : 'dark');
  }

  private loadSaved(): ThemeMode {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') return saved;
    // Tôn trọng system preference nếu chưa có lựa chọn
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
