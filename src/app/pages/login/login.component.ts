import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = signal('');
  loading = signal(false);
  message = signal('');
  error = signal('');

  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    // If already logged in, go to dashboard
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  async onSubmit() {
    if (!this.email()) return;

    this.loading.set(true);
    this.message.set('');
    this.error.set('');

    const { error } = await this.auth.signInWithEmail(this.email());
    
    this.loading.set(false);
    if (error) {
      this.error.set(error.message);
    } else {
      this.message.set('Kiểm tra email của bạn để nhận liên kết đăng nhập!');
    }
  }
}
