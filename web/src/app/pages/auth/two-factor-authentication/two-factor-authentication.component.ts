import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import {
  TwoFactorAuthenticationInterface, TwoFactorAuthenticationResponseInterface
} from './two-factor-authentication.interface';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HttpErrorResponse } from '@angular/common/http';
import { StorageService } from '../../../services/storage/storage.service';

@Component({
  selector: 'app-two-factor-authentication',
  templateUrl: './two-factor-authentication.component.html',
  styleUrls: ['./two-factor-authentication.component.less']
})
export class TwoFactorAuthenticationComponent implements OnInit {

  formGroup: FormGroup;
  passwordVisible: boolean;
  nzLoading: boolean;
  twoFactorAuthenticationAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };

  constructor (
    public title: Title,
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private nzNotificationService: NzNotificationService,
    private storageService: StorageService
  ) {
    this.formGroup = this.formBuilder.group({
      access_token: [this.storageService.getStorage('accessToken'), [Validators.required]],
      otp: [null, [Validators.required]]
    });
    this.passwordVisible = false;
    this.nzLoading = false;
    this.twoFactorAuthenticationAlert = null;
  }

  ngOnInit(): void {
    if (
      this.storageService.getStorage('accessToken') === null || this.storageService.getStorage('accessToken') === undefined
    ) {
      this.router.navigate(['/login']).catch(() => console.log(`Can\'t navigate to dashboard.`));
    }
    this.title.setTitle('QNode - 2FA');
  }

  clear(): void {
    this.formGroup.reset();
    this.passwordVisible = false;
    this.nzLoading = false;
    this.twoFactorAuthenticationAlert = null;
  }

  twoFactorAuthentication(twoFactorAuthenticationInterface: TwoFactorAuthenticationInterface): void {
    this.nzLoading = true;
    for (const index in this.formGroup?.controls) {
      if (this.formGroup?.controls[index]?.invalid) {
        this.formGroup?.controls[index]?.markAsDirty();
        this.formGroup?.controls[index]?.updateValueAndValidity();
      }
    }
    for (const index in this.formGroup?.controls) {
      if (this.formGroup?.controls[index]?.invalid) {
        this.nzLoading = false;
        return;
      }
    }

    this.authService.twoFactorAuthentication(twoFactorAuthenticationInterface)
      .subscribe((twoFactorAuthenticationResponseInterface: TwoFactorAuthenticationResponseInterface) => {
        this.nzLoading = false;
        // this.nzNotificationService.create('success', 'Success', `Hello there, Welcome Back to QNode. Qtum ETH-JSON-RPC (Mainnet and Testnet) node provider.`);
        this.router.navigate(['/dashboard']).catch(() => console.log(`Can\'t navigate to dashboard.`));
      }, (httpErrorResponse: HttpErrorResponse) => {
        this.nzLoading = false;
        if (httpErrorResponse.status === 0) {
          this.twoFactorAuthenticationAlert = {
            type: 'error', message: `Please check your connection and try again.`
          };
        } else if (httpErrorResponse.status === 500) {
          this.twoFactorAuthenticationAlert = {
            type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
          };
        } else {
          this.twoFactorAuthenticationAlert = {
            type: 'error', message: httpErrorResponse?.error?.error?.message
          };
        }
        console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
      });
  }
}
