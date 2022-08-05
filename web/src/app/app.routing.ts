import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProtectedGuard, PublicGuard } from "ngx-auth";

import { HomeComponent } from './layouts/home/home.component';
import { FullscreenComponent } from './layouts/fullscreen/fullscreen.component';
import { PassportComponent } from './layouts/passport/passport.component';
import { ErrorComponent } from './pages/error/error.component';
import { environment } from "../environments/environment";

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'prefix',
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/home/home.module').then((module) => module.HomeModule),
        pathMatch: 'full',
      }
    ]
  },
  {
    path: 'confirm-email/:token',
    component: PassportComponent,
    pathMatch: 'prefix',
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/confirm-email/confirm-email.module').then((module) => module.ConfirmEmailModule),
        pathMatch: 'full'
      },
    ]
  },
  {
    path: 'dashboard',
    canActivate: [
      ProtectedGuard
    ],
    loadChildren: () => import('./pages/dashboard/dashboard.module').then((module) => module.DashboardModule),
    pathMatch: 'prefix'
  },
  {
    path: '',
    canActivate: [
      PublicGuard
    ],
    loadChildren: () => import('./pages/auth/auth.module').then((module) => module.AuthModule),
    pathMatch: 'prefix'
  },
  {
    path: '**',
    component: FullscreenComponent,
    pathMatch: 'prefix',
    children: [
      {
        path: '',
        component: ErrorComponent,
        pathMatch: 'full'
      },
    ],
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      enableTracing: environment.enableTracing,
      useHash: environment.useHash,
      // scrollPositionRestoration: 'top'
    })
  ],
  exports: [
    RouterModule
  ]
})
export class AppRouting { }
