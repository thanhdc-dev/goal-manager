import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../core/services/auth.service";
import { SyncService } from "../../core/services/sync.service";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="header">
      <div class="header-content">
        <a routerLink="/" class="brand">
          <div class="logo">
            <svg
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
          <span class="app-name">Goal Tracker</span>
        </a>

        <div class="actions">
          @if (!sync.isOnline()) {
            <div class="sync-status offline">
              <span class="dot"></span>
              <span class="status-text">Đang ngoại tuyến</span>
            </div>
          } @else if (sync.isSyncing()) {
            <div class="sync-status syncing">
              <span class="spinner"></span>
              <span class="status-text">Đang đồng bộ...</span>
            </div>
          } @else {
            <div class="sync-status synced">
              <span class="dot"></span>
              <span class="status-text">Đã sao lưu</span>
            </div>
          }

          <div class="user-menu">
            <span class="user-email">{{ auth.user()?.email }}</span>
            <button
              (click)="auth.signOut()"
              class="btn-logout"
              title="Đăng xuất"
            >
              <svg
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
  `,
  styles: [
    `
      .header {
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        position: sticky;
        top: 0;
        z-index: 100;
        padding: 0.75rem 1.5rem;
      }

      .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
        color: var(--text-main, #1e293b);

        .logo {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          svg {
            width: 18px;
            height: 18px;
          }
        }

        .app-name {
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.02em;
        }
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }

      .sync-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: #64748b;
        padding: 0.4rem 0.75rem;
        background: #f1f5f9;
        border-radius: 2rem;

        &.synced .dot {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px #22c55e;
        }

        &.offline .dot {
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 8px #ef4444;
        }
      }

      .user-menu {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding-left: 1rem;
        border-left: 1px solid #e2e8f0;

        .user-email {
          font-size: 0.85rem;
          color: #475569;
          font-weight: 500;
        }
      }

      .btn-logout {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 0.4rem;
        border-radius: 0.5rem;
        transition: all 0.2s;
        display: flex;

        &:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        svg {
          width: 18px;
          height: 18px;
        }
      }

      .spinner {
        width: 12px;
        height: 12px;
        border: 2px solid #e2e8f0;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 640px) {
        .user-email {
          display: none;
        }
        .status-text {
          display: none;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  auth = inject(AuthService);
  sync = inject(SyncService);
}
