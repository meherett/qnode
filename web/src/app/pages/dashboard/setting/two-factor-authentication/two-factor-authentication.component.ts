import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../../../services/storage/storage.service';
import { UserService } from '../../../../services/user/user.service';
import { AuthService } from '../../../../services/auth/auth.service';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import {
  Generate2FAResponseInterface, Enable2FAInterface, Enable2FAResponseInterface, Disable2FAInterface, Disable2FAResponseInterface
} from './two-factor-authentication.interface';
import { ClipboardService } from 'ngx-clipboard';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-two-factor-authentication',
  templateUrl: './two-factor-authentication.component.html',
  styleUrls: ['./two-factor-authentication.component.less']
})
export class TwoFactorAuthenticationComponent implements OnInit {

  formGroupEnable: FormGroup;
  formGroupDisable: FormGroup;
  nzLoadingEnable: boolean;
  nzLoadingDisable: boolean;
  nzLoadingGenerate: boolean;
  nzDisabledGenerate: boolean;
  isDisableVisible = false;

  enable2FAAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };
  disable2FAAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };

  @Input() userResponseInterface: any | Generate2FAResponseInterface | Enable2FAResponseInterface | Disable2FAResponseInterface | null = null;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public storageService: StorageService,
    public userService: UserService,
    public authService: AuthService,
    public clipboardService: ClipboardService,
    public nzNotificationService: NzNotificationService,
    private formBuilder: FormBuilder
  ) {
    this.formGroupEnable = this.formBuilder.group({
      otp: [null, [Validators.required]]
    });
    this.formGroupDisable = this.formBuilder.group({
      otp: [null, [Validators.required]]
    });
    this.nzLoadingEnable = false;
    this.nzLoadingGenerate = false;
    this.nzDisabledGenerate = false;
    this.nzLoadingDisable = false;
    this.enable2FAAlert = null;
    this.disable2FAAlert = null;
  }

  ngOnInit(): void {
  }

  showDisableModal(): void {
    this.isDisableVisible = true;
  }

  handleDisableCancel(): void {
    this.isDisableVisible = false;
    this.clearDisable()
  }

  clearEnable(): void {
    this.formGroupEnable.reset();
    this.nzLoadingEnable = false;
    this.enable2FAAlert = null;
    this.disable2FAAlert = null;
  }

  clearDisable(): void {
    this.formGroupDisable.reset();
    this.nzLoadingDisable = false;
    this.enable2FAAlert = null;
    this.disable2FAAlert = null;
  }

  copy(token: string) {
      this.clipboardService.copy(token);
      this.nzNotificationService.create('success', 'Success',`Copied the 2FA OTP token!`);
  }

  generate2FA() {
    this.nzLoadingGenerate = true;
    this.formGroupEnable.reset();
    this.formGroupDisable.reset();
    this.enable2FAAlert = null;
    this.disable2FAAlert = null;

    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.userService.get(`/${this.storageService.getStorage('user_id')}/generate-2fa`, headers).subscribe((
      generate2FAResponseInterface: Generate2FAResponseInterface
    ) => {
      this.userResponseInterface = generate2FAResponseInterface;
      this.nzLoadingGenerate = false;
      this.nzDisabledGenerate = true;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingGenerate = false;
      if (httpErrorResponse.status === 0) {
        this.nzNotificationService.create('error', 'Error',`Please check your connection and try again.`);
      } else if (httpErrorResponse.status === 500) {
        this.nzNotificationService.create('error', 'Error',`Something went wrong, our team has been notified. Try again later.`);
      } else {
        this.nzNotificationService.create('error', 'Error', httpErrorResponse?.error?.error?.message);
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }

  enable2FA(enable2FAInterface: Enable2FAInterface) {
    this.nzLoadingEnable = true;
    for (const index in this.formGroupEnable?.controls) {
      if (this.formGroupEnable?.controls[index]?.invalid) {
        this.formGroupEnable?.controls[index]?.markAsDirty();
        this.formGroupEnable?.controls[index]?.updateValueAndValidity();
      }
    }
    for (const index in this.formGroupEnable?.controls) {
      if (this.formGroupEnable?.controls[index]?.invalid) {
        this.nzLoadingEnable = false;
        return;
      }
    }

    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.userService.create(enable2FAInterface, headers, `/${this.storageService.getStorage('user_id')}/enable-2fa`).subscribe((
      enable2FAResponseInterface: Enable2FAResponseInterface
    ) => {
      this.userResponseInterface = enable2FAResponseInterface;
      this.nzLoadingEnable = false;
      this.clearEnable();
      this.nzNotificationService.create('success', 'Success',`Successfully 2FA OTP enabled.`);
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingEnable = false;
      if (httpErrorResponse.status === 0) {
        this.enable2FAAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.enable2FAAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.enable2FAAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }

  disable2FA(disable2FAInterface: Disable2FAInterface) {
    this.nzLoadingDisable = true;
    for (const index in this.formGroupDisable?.controls) {
      if (this.formGroupDisable?.controls[index]?.invalid) {
        this.formGroupDisable?.controls[index]?.markAsDirty();
        this.formGroupDisable?.controls[index]?.updateValueAndValidity();
      }
    }
    for (const index in this.formGroupDisable?.controls) {
      if (this.formGroupDisable?.controls[index]?.invalid) {
        this.nzLoadingDisable = false;
        return;
      }
    }

    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.userService.create(disable2FAInterface, headers, `/${this.storageService.getStorage('user_id')}/disable-2fa`).subscribe((
      disable2FAResponseInterface: Disable2FAResponseInterface
    ) => {
      this.userResponseInterface = disable2FAResponseInterface;
      this.nzLoadingDisable = false;
      this.handleDisableCancel();
      this.nzNotificationService.create('success', 'Success',`Successfully 2FA OTP disabled.`);
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingDisable = false;
      if (httpErrorResponse.status === 0) {
        this.disable2FAAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.disable2FAAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.disable2FAAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }
}
