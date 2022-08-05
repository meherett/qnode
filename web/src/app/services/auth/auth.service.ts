import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { tap, map, switchMap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService as NGXAuthService } from 'ngx-auth';

import { LoginService} from './login/login.service';
import { RegisterService} from './register/register.service';
import { EmailIsRegisteredService } from './email-is-registered/email-is-registered.service';
import { TokenIsExpiredService } from './token-is-expired/token-is-expired.service';
import { ForgotService } from './forgot/forgot.service';
import { ResetService } from './reset/reset.service';
import { StorageService } from '../storage/storage.service';
import { SendEmailConfirmationService } from './send-email-confirmation/send-email-confirmation.service';
import { LoginInterface, LoginResponseInterface } from '../../pages/auth/login/login.interface';
import { RegisterInterface } from '../../pages/auth/register/register.interface';
import { ForgotInterface } from '../../pages/auth/forgot/forgot.interface';
import { ResetInterface } from '../../pages/auth/reset/reset.interface';
import { ResetOldPasswordInterface } from '../../pages/dashboard/setting/setting.interface';
import { ConfirmEmailService } from './confirm-email/confirm-email.service';
import { TwoFactorAuthenticationService } from './two-factor-authentication/two-factor-authentication.service';
import {
  TwoFactorAuthenticationInterface,
  TwoFactorAuthenticationResponseInterface
} from '../../pages/auth/two-factor-authentication/two-factor-authentication.interface';

interface TokenInterface {
  access_token: string;
  refresh_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements NGXAuthService, OnInit {

  constructor(
    private router: Router,
    private httpClient: HttpClient,
    private loginService: LoginService,
    private registerService: RegisterService,
    private twoFactorAuthenticationService: TwoFactorAuthenticationService,
    private emailIsRegisteredService: EmailIsRegisteredService,
    private sendEmailConfirmationService: SendEmailConfirmationService,
    private confirmEmailService: ConfirmEmailService,
    private tokenIsExpiredService: TokenIsExpiredService,
    private forgotService: ForgotService,
    private resetService: ResetService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
  }

  public isAuthorized(): Observable <boolean> {
    // this.logout();
    return this.getAccessToken().pipe(map((access_token: string) => !! access_token));
  }

  public getAccessToken(): Observable <string> {
    const accessToken: string = <string>this.storageService.getStorage('accessToken');
    return of(accessToken);
  }

  public getRefreshToken(): Observable <string> {
    const refreshToken: string = <string>this.storageService.getStorage('refreshToken');
    return of(refreshToken);
  }

  public refreshToken(): Observable <TokenInterface> {
    // @ts-ignore
    return this.getRefreshToken().pipe(switchMap((refresh_token: string) => {
        this.httpClient.post(`https://byswap-api.herokuapp.com/auth/refresh`, {
          refresh_token: refresh_token
        });
      }), tap((tokenInterface: TokenInterface) => this.saveToken(tokenInterface)),
      catchError((httpErrorResponse: HttpErrorResponse) => {
        this.logout(); return throwError(httpErrorResponse)})
    );
  }

  public refreshShouldHappen(httpErrorResponse: HttpErrorResponse): boolean {
    return httpErrorResponse.status === 401;
  }

  public verifyTokenRequest(url: string): boolean {
    return url.endsWith('/refresh');
  }

  public login(loginInterface: LoginInterface): Observable<any> {
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'POST')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    return this.loginService.create(loginInterface, headers, '/login')
      .pipe(tap((loginResponseInterface: LoginResponseInterface | any) => {
        this.storageService.setStorage('email', loginResponseInterface.data.user.email);
        this.storageService.setStorage('user_id', loginResponseInterface.data.user._id.$oid);
        this.storageService.setStorage('is_confirmed', loginResponseInterface.data.user.is_confirmed);
        this.saveToken(loginResponseInterface.data.token);
      }));
  }

  public register(registerInterface: RegisterInterface): Observable<any> {
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'POST')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    return this.registerService.create(registerInterface, headers, '/register');
  }

  public twoFactorAuthentication(twoFactorAuthenticationInterface: TwoFactorAuthenticationInterface): Observable<any> {
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'POST')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    return this.loginService.create(twoFactorAuthenticationInterface, headers, '/2fa')
      .pipe(tap((twoFactorAuthenticationResponseInterface: TwoFactorAuthenticationResponseInterface | any) => {
        this.storageService.setStorage('email', twoFactorAuthenticationResponseInterface.data.user.email);
        this.storageService.setStorage('user_id', twoFactorAuthenticationResponseInterface.data.user._id.$oid);
        this.storageService.setStorage('is_confirmed', twoFactorAuthenticationResponseInterface.data.user.is_confirmed);
        this.saveToken(twoFactorAuthenticationResponseInterface.data.token);
      }));
  }

  public forgot(forgotInterface: ForgotInterface): Observable<any> {
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'POST')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    return this.forgotService.create(forgotInterface, headers, '/forgot');
  }

  public reset(resetInterface: ResetInterface): Observable<any> {
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'POST')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    return this.resetService.create(resetInterface, headers, '/reset');
  }

  public resetOldPassword(_id: string, resetOldPasswordInterface: { old_password: string, new_password: string }): Observable<any> {
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'POST')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    return this.resetService.create(resetOldPasswordInterface, headers, `/reset/${_id}`);
  }

  public sendEmailConfirmation(_id: string): Observable<any> {
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'POST')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    return this.sendEmailConfirmationService.get(`/send-email-confirmation/${_id}`, headers);
  }

  public confirmEmail(token: string): Observable<any> {
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'POST')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    return this.confirmEmailService.get(`/confirm-email/${token}`, headers);
  }

  public logout() {
    this.storageService.clearStorage('user_id');
    this.storageService.clearStorage('language');
    this.storageService.clearStorage('refreshToken');
    this.storageService.clearStorage('accessToken');
    this.storageService.clearStorage('email');
    this.storageService.clearStorage('isCollapsed');
    return window.location.reload();
  }

  public emailIsRegistered(email: string): Observable <any> {
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'POST')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    return this.emailIsRegisteredService.create({email: email}, headers, '/email-is-registered');
  }

  public tokenIsExpired(token: string): Observable <any> {
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'POST')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    return this.tokenIsExpiredService.get('/token-is-expired', headers, `/${token}`);
  }

  private saveToken({ access_token, refresh_token }: TokenInterface): void {
    this.storageService
      .setStorage('accessToken', access_token)
      .setStorage('refreshToken', refresh_token);
  }
}
