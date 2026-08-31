import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { AuthProvider } from '../../shared/models/auth.model';

interface ProviderOption {
  key: AuthProvider;
  label: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal<AuthProvider | null>(null);
  error = signal('');

  providers: ProviderOption[] = [
    { key: 'google', label: 'Tiếp tục với Google' },
    { key: 'github', label: 'Tiếp tục với GitHub' },
    { key: 'zalo', label: 'Tiếp tục với Zalo' },
  ];

  constructor() {
    // Lỗi do callback trả về (?error=...)
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) this.error.set(decodeURIComponent(err));

    // Nếu đã đăng nhập, về dashboard
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  async loginWith(provider: AuthProvider) {
    this.loading.set(provider);
    this.error.set('');

    try {
      await this.auth.signInWithProvider(provider);
      // Thành công: browser sẽ được redirect tới authUrl của provider
    } catch (e: any) {
      this.error.set(
        e?.error?.message ?? e?.message ?? 'Đăng nhập thất bại, vui lòng thử lại'
      );
      this.loading.set(null);
    }
  }
}
