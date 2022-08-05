import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AuthModule as NGXAuthModule, AUTH_SERVICE, PUBLIC_FALLBACK_PAGE_URI, PROTECTED_FALLBACK_PAGE_URI
} from 'ngx-auth';

import { AuthService } from '../services/auth/auth.service';
import { LoginService} from '../services/auth/login/login.service';
import { RegisterService } from '../services/auth/register/register.service';
import { EmailIsRegisteredService } from '../services/auth/email-is-registered/email-is-registered.service';
import { TokenIsExpiredService } from '../services/auth/token-is-expired/token-is-expired.service';
import { ForgotService } from '../services/auth/forgot/forgot.service';
import { ResetService } from '../services/auth/reset/reset.service';
import { StorageService } from '../services/storage/storage.service';

export function factory(authService: AuthService) {
  return authService;
}

@NgModule({
  imports: [
    CommonModule,
    NGXAuthModule
  ],
  providers: [
    AuthService,
    {
      provide: PROTECTED_FALLBACK_PAGE_URI,
      useValue: '/'
    },
    {
      provide: PUBLIC_FALLBACK_PAGE_URI,
      useValue: '/login'
    },
    {
      provide: AUTH_SERVICE,
      deps: [
        AuthService
      ],
      useFactory: factory
    },
    LoginService,
    RegisterService,
    EmailIsRegisteredService,
    TokenIsExpiredService,
    ForgotService,
    ResetService,
    StorageService
  ]
})
export class AuthModule { }
