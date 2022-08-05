import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PassportComponent } from "../../layouts/passport/passport.component";

const routes: Routes = [
  {
    path: '',
    component: PassportComponent,
    pathMatch: 'prefix',
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadChildren: () => import('./login/login.module').then((module) => module.LoginModule),
        pathMatch: 'full',
      },
      {
        path: 'register',
        loadChildren: () => import('./register/register.module').then((module) => module.RegisterModule),
        pathMatch: 'full',
      },
      {
        path: '2fa',
        loadChildren: () => import('./two-factor-authentication/two-factor-authentication.module').then((module) => module.TwoFactorAuthenticationModule),
        pathMatch: 'full',
      },
      {
        path: 'forgot',
        loadChildren: () => import('./forgot/forgot.module').then((module) => module.ForgotModule),
        pathMatch: 'full',
      },
      {
        path: 'reset',
        loadChildren: () => import('./reset/reset.module').then((module) => module.ResetModule),
        pathMatch: 'full',
      }
    ]
  }];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AuthRouting { }
