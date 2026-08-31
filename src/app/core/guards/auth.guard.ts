import { inject } from "@angular/core";
import { Router, CanActivateFn } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Chờ session khôi phục xong (tránh redirect sai khi đang refresh token)
  await auth.whenInitialized();

  if (auth.isAuthenticated()) {
    return true;
  }

  // Chuyển hướng về login nếu chưa đăng nhập
  return router.createUrlTree(['/login']);
};
