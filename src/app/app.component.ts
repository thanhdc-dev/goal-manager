import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaUpdateService } from './core/services/pwa-update.service';
import { SyncService } from './core/services/sync.service';

import { HeaderComponent } from './components/header/header.component';
import { AuthService } from './core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CommonModule],
  template: `
    @if (auth.isAuthenticated()) {
      <app-header />
    }
    <main>
      <router-outlet />
    </main>
  `,
})
export class AppComponent {
  auth = inject(AuthService);
  
  constructor() {
    inject(PwaUpdateService).init();
    inject(SyncService); // Initialize sync logic
  }
}
