// src/app/core/services/api.service.ts

import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { firstValueFrom, Subject } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  AuthCallbackResponse,
  AuthProvider,
  AuthTokens,
  AuthUser,
  LoginUrlResponse,
} from "../../shared/models/auth.model";
import { Goal } from "../../shared/models/goal.model";
import { Log } from "../../shared/models/log.model";

const ACCESS_TOKEN_KEY = "gm_access_token";
const REFRESH_TOKEN_KEY = "gm_refresh_token";

/**
 * Tầng gọi API nội bộ api.thanhdc.dev.
 * Quản lý token (localStorage), tự gắn Authorization: Bearer,
 * xử lý 401 → refresh 1 lần → retry; refresh fail → báo sessionExpired.
 *
 * LƯU Ý: Hợp đồng sync dữ liệu (goals/goal-logs) tuân theo `docs/backend-api-spec.md`
 * — REST, camelCase; định danh công khai là `key` (UUID do client sinh).
 */
@Injectable({ providedIn: "root" })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  /** Phát khi token hết hạn hoàn toàn (refresh fail) — AuthService lắng nghe để logout */
  readonly sessionExpired$ = new Subject<void>();

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  // ─── Generic request: gắn Bearer + 401 → refresh → retry ───────────────
  async request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    retry = true,
  ): Promise<T> {
    let headers = new HttpHeaders();
    if (this.accessToken) {
      headers = headers.set("Authorization", `Bearer ${this.accessToken}`);
    }

    const req = this.http.request<T>(method, `${this.baseUrl}${path}`, {
      headers,
      body: body as BodyInit | undefined,
    });

    try {
      return await firstValueFrom(req);
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 401 && retry) {
        const refreshed = await this.tryRefresh();
        if (refreshed) {
          return this.request<T>(method, path, body, false);
        }
      }
      throw err;
    }
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) return false;
    try {
      const tokens = await firstValueFrom(
        this.http.post<AuthTokens>(`${this.baseUrl}/auth/refresh`, { refreshToken }),
      );
      this.setTokens(tokens);
      return true;
    } catch {
      this.clearTokens();
      this.sessionExpired$.next();
      return false;
    }
  }

  // ─── Auth (theo tài liệu auth-login-v2-integration.md) ─────────────────
  getLoginUrl(provider: AuthProvider): Promise<LoginUrlResponse> {
    return this.request<LoginUrlResponse>(
      "GET",
      `/auth/${provider}/login-url?app=${environment.appKey}`,
    );
  }

  callback(code: string, state: string): Promise<AuthCallbackResponse> {
    return this.request<AuthCallbackResponse>(
      "GET",
      `/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    );
  }

  me(): Promise<AuthUser> {
    return this.request<AuthUser>("GET", "/auth/me");
  }

  logout(): Promise<void> {
    return this.request<void>("DELETE", "/auth/logout");
  }

  // ─── Data sync (theo docs/backend-api-spec.md) ─────────────────────────
  getGoals(): Promise<Goal[]> {
    return this.request<Goal[]>("GET", "/goals");
  }

  getLogs(): Promise<Log[]> {
    return this.request<Log[]>("GET", "/goal-logs");
  }

  createGoal(goal: Goal): Promise<Goal> {
    return this.request<Goal>("POST", "/goals", this.goalPayload(goal));
  }

  updateGoal(key: string, goal: Goal): Promise<Goal> {
    return this.request<Goal>("PUT", `/goals/${key}`, this.goalPayload(goal));
  }

  deleteGoal(key: string): Promise<void> {
    return this.request<void>("DELETE", `/goals/${key}`);
  }

  createLog(log: Log): Promise<Log> {
    return this.request<Log>("POST", "/goal-logs", this.logPayload(log, true));
  }

  updateLog(key: string, log: Log): Promise<Log> {
    return this.request<Log>("PUT", `/goal-logs/${key}`, this.logPayload(log, false));
  }

  deleteLog(key: string): Promise<void> {
    return this.request<void>("DELETE", `/goal-logs/${key}`);
  }

  /** Chỉ gửi field theo spec §5.2 — bỏ `syncStatus`/`createdAt`/`updatedAt`. */
  private goalPayload(goal: Goal) {
    return {
      key: goal.key,
      name: goal.name,
      targetValue: goal.targetValue,
      unit: goal.unit,
      valueType: goal.valueType,
      startDate: goal.startDate,
      endDate: goal.endDate,
      accumulationType: goal.accumulationType,
      description: goal.description,
      color: goal.color,
    };
  }

  /** POST log gửi `key`+`goalKey`; PUT chỉ gửi `value`/`date`/`note` (spec §6.3). */
  private logPayload(log: Log, includeKeys: boolean) {
    const base = { value: log.value, date: log.date, note: log.note };
    return includeKeys ? { key: log.key, goalKey: log.goalKey, ...base } : base;
  }
}
