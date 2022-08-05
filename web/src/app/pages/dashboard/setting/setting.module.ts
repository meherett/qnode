import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingComponent } from './setting.component';
import { NG_ZORRO_MODULES } from '../../../modules/ng-zorro.module';
import { SettingRouting } from './setting.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BasicDetailsComponent } from './basic-details/basic-details.component';
import { ProfileComponent } from './profile/profile.component';
import { EmailNotificationsComponent } from './email-notifications/email-notifications.component';
import { PasswordComponent } from './password/password.component';
import { TwoFactorAuthenticationComponent } from './two-factor-authentication/two-factor-authentication.component';
import { QRCodeModule } from 'angular2-qrcode';



@NgModule({
  declarations: [
    SettingComponent,
    BasicDetailsComponent,
    ProfileComponent,
    EmailNotificationsComponent,
    PasswordComponent,
    TwoFactorAuthenticationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    QRCodeModule,
    ReactiveFormsModule,
    ...NG_ZORRO_MODULES,
    SettingRouting
  ]
})
export class SettingModule { }
