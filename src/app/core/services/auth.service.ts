import { Injectable, signal, computed, inject } from "@angular/core";
import { Router } from "@angular/router";
import { ApiService } from "./api.service";
import { AuthProvider, AuthUser } from "../../shared/models/auth.model";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private _user = signal<AuthUser | null>(null);
  private _isInitialized = signal(false);
  private initPromise: Promise<void>;

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());
  readonly isInitialized = this._isInitialized.asReadonly();

  constructor() {
    // Token hết hạn hoàn toàn (refresh fail) → đăng xuất tự động
    this.api.sessionExpired$.subscribe(() => {
      this._user.set(null);
      this.router.navigate(["/login"]);
    });

    this.initPromise = this.init();
  }

  /** Promise resolve khi quá trình khôi phục session hoàn tất (guard dùng) */
  whenInitialized(): Promise<void> {
    return this.initPromise;
  }

  private async init(): Promise<void> {
    try {
      if (this.api.accessToken || this.api.refreshToken) {
        await this.restoreSession();
      }
    } finally {
      this._isInitialized.set(true);
    }
  }

  private async restoreSession(): Promise<void> {
    try {
      // api.me() tự refresh 1 lần nếu gặp 401; fail nữa thì coi như hết hạn
      const user = await this.api.me();
      this._user.set(user);
    } catch {
      this.api.clearTokens();
      this._user.set(null);
    }
  }

  /** Lấy URL đăng nhập theo provider rồi đưa browser tới đó */
  async signInWithProvider(provider: AuthProvider): Promise<void> {
    const { authUrl } = await this.api.getLoginUrl(provider);
    window.location.href = authUrl;
  }

  /** Đổi code + state lấy token tại route /auth/callback */
  async handleCallback(code: string, state: string): Promise<void> {
    const data = await this.api.callback(code, state);
    this.api.setTokens(data.tokens);
    this._user.set(data.user);
  }

  async signOut(): Promise<void> {
    try {
      await this.api.logout();
    } catch (e) {
      console.error("Error signing out:", e);
    } finally {
      this.api.clearTokens();
      localStorage.clear(); // Xóa sạch dữ liệu local khi logout để bảo mật
      this._user.set(null);
      this.router.navigate(["/login"]);
    }
  }
}
