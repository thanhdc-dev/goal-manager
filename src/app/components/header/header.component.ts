import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../core/services/auth.service";
import { SyncService } from "../../core/services/sync.service";
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="sticky top-0 z-50 px-6 py-3 bg-white/80 dark:bg-app-bg/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 transition-colors duration-250">
      <div class="max-w-[1200px] mx-auto flex justify-between items-center">
        <a routerLink="/" class="flex items-center gap-3 no-underline text-app-text">
          <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-lg flex items-center justify-center">
            <svg
              class="w-[18px] h-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              />
            </svg>
          </div>
          <span class="font-extrabold text-[1.1rem] tracking-tight">Goal Tracker</span>
        </a>

        <div class="actions flex items-center gap-6">
          @if (!sync.isOnline()) {
            <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-app-muted px-3 py-1.5 bg-slate-100 dark:bg-app-surface rounded-full">
              <span class="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,1)]"></span>
              <span class="max-sm:hidden">Đang ngoại tuyến</span>
            </div>
          } @else if (sync.isSyncing()) {
            <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-app-muted px-3 py-1.5 bg-slate-100 dark:bg-app-surface rounded-full">
              <span class="w-3 h-3 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></span>
              <span class="max-sm:hidden">Đang đồng bộ...</span>
            </div>
          } @else {
            <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-app-muted px-3 py-1.5 bg-slate-100 dark:bg-app-surface rounded-full">
              <span class="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,1)]"></span>
              <span class="max-sm:hidden">Đã sao lưu</span>
            </div>
          }

          <div class="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-app-border">
            <span class="text-[0.85rem] text-slate-600 dark:text-app-muted font-medium max-sm:hidden">{{ auth.user()?.email }}</span>
            <button
              (click)="auth.signOut()"
              class="bg-transparent border-none text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 p-1.5 rounded-lg transition-all duration-200 flex cursor-pointer"
              title="Đăng xuất"
            >
              <svg
                class="w-[18px] h-[18px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  auth = inject(AuthService);
  sync = inject(SyncService);
}
