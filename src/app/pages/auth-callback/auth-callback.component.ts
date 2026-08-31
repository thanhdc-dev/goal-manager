import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-callback.component.html',
})
export class AuthCallbackComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  async ngOnInit(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    // Provider trả lỗi trực tiếp (vd user từ chối)
    if (error) {
      this.router.navigate(['/login'], {
        queryParams: { error: decodeURIComponent(error) },
      });
      return;
    }

    // Thiếu code/state — link cũ hoặc truy cập trực tiếp
    if (!code || !state) {
      this.router.navigate(['/login'], {
        queryParams: { error: 'Phiên đăng nhập không hợp lệ, vui lòng thử lại' },
      });
      return;
    }

    try {
      await this.auth.handleCallback(code, state);
      this.router.navigate(['/']);
    } catch (e: any) {
      const apiCode = e?.error?.code;
      const msg =
        apiCode === 'ERR_STATE_INVALID_OR_EXPIRED'
          ? 'Phiên đăng nhập hết hạn, vui lòng thử lại'
          : 'Đăng nhập thất bại, vui lòng thử lại';
      this.router.navigate(['/login'], { queryParams: { error: msg } });
    }
  }
}
