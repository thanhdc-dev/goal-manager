import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    // OAuth v2 callback: provider redirect về đây kèm code + state
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'goal/:id',
    loadComponent: () =>
      import('./pages/goal-detail/goal-detail.component').then(m => m.GoalDetailComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' },
];
