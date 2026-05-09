import { Injectable, ApplicationRef, inject, isDevMode } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, first, switchMap, interval, concat } from 'rxjs';

/**
 * Service quản lý vòng đời PWA:
 * - Phát hiện phiên bản mới và nhắc người dùng refresh
 * - Kiểm tra cập nhật định kỳ (mỗi 6 giờ)
 * - Xử lý SW không phục hồi được (unrecoverable state)
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);

  /**
   * Gọi hàm này một lần khi app khởi động (trong AppComponent)
   */
  init(): void {
    if (!this.swUpdate.isEnabled || isDevMode()) return;

    this.checkForUpdatesOnStable();
    this.promptOnNewVersion();
    this.handleUnrecoverableState();
  }

  /**
   * Khi app đã ổn định lần đầu, bắt đầu kiểm tra cập nhật mỗi 6 giờ
   */
  private checkForUpdatesOnStable(): void {
    const appIsStable$ = this.appRef.isStable.pipe(first(isStable => isStable));
    const every6Hours$ = interval(6 * 60 * 60 * 1000);
    const every6HoursOnceStable$ = concat(appIsStable$, every6Hours$);

    every6HoursOnceStable$.pipe(
      switchMap(() => this.swUpdate.checkForUpdate())
    ).subscribe();
  }

  /**
   * Khi có phiên bản mới sẵn sàng, hỏi người dùng có muốn cập nhật không
   */
  private promptOnNewVersion(): void {
    this.swUpdate.versionUpdates.pipe(
      filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
    ).subscribe(() => {
      const reload = confirm(
        '🎉 Có phiên bản mới của GoalTracker!\n\nBấm OK để cập nhật ngay.'
      );
      if (reload) {
        window.location.reload();
      }
    });
  }

  /**
   * Nếu SW rơi vào trạng thái không phục hồi được, tự động reload
   */
  private handleUnrecoverableState(): void {
    this.swUpdate.unrecoverable.subscribe(event => {
      console.error('[PWA] Service Worker không phục hồi được:', event.reason);
      alert('Ứng dụng gặp sự cố. Trang sẽ được tải lại để khôi phục.');
      window.location.reload();
    });
  }
}
