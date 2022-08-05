import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../services/auth/auth.service';
import { LoginInterface, LoginResponseInterface} from './login.interface';
import { Title } from '@angular/platform-browser';
import { StorageService } from '../../../services/storage/storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent implements OnInit {

  formGroup: FormGroup;
  passwordVisible: boolean;
  nzLoading: boolean;
  loginAlert: null | {
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
      email: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required]]
    });
    this.passwordVisible = false;
    this.nzLoading = false;
    this.loginAlert = null;
  }

  ngOnInit(): void {
    this.title.setTitle('QNode - Login');
  }

  clear(): void {
    this.formGroup.reset();
    this.passwordVisible = false;
    this.nzLoading = false;
    this.loginAlert = null;
  }

  login(loginInterface: LoginInterface): void {
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

    this.authService.login(loginInterface)
      .subscribe((loginResponseInterface: LoginResponseInterface) => {
        this.nzLoading = false;
        if (loginResponseInterface.data?.token.token_type === 'valid') {
          // this.nzNotificationService.create('success', 'Success', `Hello there, Welcome Back to QNode. Qtum ETH-JSON-RPC (Mainnet and Testnet) node provider.`);
          this.router.navigate(['/dashboard']).catch(() => console.log(`Can\'t navigate to dashboard.`));
        } else {
          this.router.navigate(['/2fa']).catch(() => console.log(`Can\'t navigate to dashboard.`));
        }
      }, (httpErrorResponse: HttpErrorResponse) => {
        this.nzLoading = false;
        if (httpErrorResponse.status === 0) {
          this.loginAlert = {
            type: 'error', message: `Please check your connection and try again.`
          };
        } else if (httpErrorResponse.status === 500) {
          this.loginAlert = {
            type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
          };
        } else {
          this.loginAlert = {
            type: 'error', message: httpErrorResponse?.error?.error?.message
          };
        }
        console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
      });
  }
}
