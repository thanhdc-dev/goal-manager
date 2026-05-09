import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { isDevMode } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Đăng ký SW sau khi app ổn định (hoặc tối đa sau 30 giây)
      // để không ảnh hưởng đến tốc độ khởi động ban đầu
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
