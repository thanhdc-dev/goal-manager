import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
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
