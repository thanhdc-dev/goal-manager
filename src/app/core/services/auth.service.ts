import { Injectable, signal, computed } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { Session, User } from "@supabase/supabase-js";
import { Router } from "@angular/router";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private _session = signal<Session | null>(null);

  readonly session = this._session.asReadonly();
  readonly user = computed(() => this._session()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this._session());

  constructor(
    private supabase: SupabaseService,
    private router: Router,
  ) {
    // 1. Khởi tạo session ngay lập tức
    this.initSession();

    // 2. Lắng nghe thay đổi trạng thái auth
    this.supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        this._session.set(session);

        if (_event === "SIGNED_OUT") {
          localStorage.clear(); // Xóa sạch dữ liệu local khi logout để bảo mật
          this.router.navigate(["/login"]);
        }
      },
    );
  }

  private async initSession() {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    this._session.set(session);
  }

  async signInWithEmail(email: string) {
    return await this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/login",
      },
    });
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) console.error("Error signing out:", error);
  }
}
