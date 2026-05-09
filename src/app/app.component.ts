import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaUpdateService } from './core/services/pwa-update.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  constructor() {
    inject(PwaUpdateService).init();
  }
}
