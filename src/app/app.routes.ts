import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'goal/:id',
    loadComponent: () =>
      import('./pages/goal-detail/goal-detail.component').then(m => m.GoalDetailComponent),
  },
  { path: '**', redirectTo: '' },
];
