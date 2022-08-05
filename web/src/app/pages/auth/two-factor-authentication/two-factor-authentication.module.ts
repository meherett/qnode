import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TwoFactorAuthenticationComponent } from './two-factor-authentication.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NG_ZORRO_MODULES } from '../../../modules/ng-zorro.module';
import { TwoFactorAuthenticationRouting } from './two-factor-authentication.routing';



@NgModule({
  declarations: [
    TwoFactorAuthenticationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ...NG_ZORRO_MODULES,
    ReactiveFormsModule,
    TwoFactorAuthenticationRouting
  ]
})
export class TwoFactorAuthenticationModule { }
