import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TwoFactorAuthenticationComponent } from './two-factor-authentication.component';

const routes: Routes = [
  {
    path: '',
    component: TwoFactorAuthenticationComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class TwoFactorAuthenticationRouting { }
