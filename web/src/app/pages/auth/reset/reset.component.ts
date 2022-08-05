import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService } from '../../../services/auth/auth.service';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ResetInterface, ResetResponseInterface, TokenIsExpiredResponseInterface } from './reset.interface';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.less']
})
export class ResetComponent implements OnInit {

  formGroup: FormGroup;
  newPasswordVisible: boolean;
  nzLoading: boolean;
  resetAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };
  visible: boolean;
  progress: number;
  status: string;
  setTimeout: any;
  passwordProgressMap: {
    [key: string]: 'success' | 'normal' | 'exception'
  };

  confirmPassword: any = (formControl: FormControl): { confirmed: boolean } | null => {
    if (!formControl || !formControl.parent!) {
      return null;
    }
    if (formControl.value !== formControl.parent!.get('new_password')!.value) {
      return { confirmed: true };
    }
    return null;
  }

  checkPassword(formControl: FormControl): void {
    if (!formControl) return;
    const self: any = this;
    self.visible = !!formControl.value;
    if (formControl.value && formControl.value.length > 10) {
      self.status = 'ok';
    } else if (formControl.value && formControl.value.length > 7) {
      self.status = 'pass';
    } else {
      self.status = 'pool';
    }
    if (self.visible) {
      self.progress = formControl.value.length * 10 > 100 ? 100 : formControl.value.length * 8;
    }
  }

  constructor(
    public title: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private nzNotificationService: NzNotificationService,
    private authService: AuthService
  ) {
    this.formGroup = this.formBuilder.group({
      token: [null, [Validators.required]],
      new_password: [null, [Validators.required, Validators.minLength(8), this.checkPassword.bind(this)]],
      confirm_password: [null, [Validators.required, Validators.minLength(8), this.confirmPassword]]
    });
    this.newPasswordVisible = false;
    this.nzLoading = false;
    this.resetAlert = null;
    this.visible = false;
    this.progress = 0;
    this.status = 'pool';
    this.passwordProgressMap = {
      ok: 'success', pass: 'normal', pool: 'exception'
    };
  }

  ngOnInit(): void {
    this.title.setTitle('QNode - Reset Password');
    this.tokenIsExpired(this.activatedRoute.snapshot.queryParams.token);
  }

  tokenIsExpired(token: string) {
    this.authService.tokenIsExpired(token)
      .subscribe((tokenIsExpiredResponseInterface: TokenIsExpiredResponseInterface) => {
        if (tokenIsExpiredResponseInterface?.data?.is_expired) {
          this.nzNotificationService.create('error', 'Error', `You can't reset the password. That confirmation token is already expired.`)
          this.router.navigate(['/']).catch(() => console.log(`Can\'t navigate to dashboard.`));
          return;
        } else {
          this.formGroup.get('token')?.setValue(token);
        }
      }, (httpErrorResponse: HttpErrorResponse) => {
        if (httpErrorResponse.status === 500) {
          this.nzNotificationService.create('error', 'Error', `Please check your connection or it's server problem. Please, try again later.`)
        } else {
          this.nzNotificationService.create('error', 'Error', `${httpErrorResponse?.error?.error?.message}`)
        }
        this.router.navigate(['/']).catch(() => console.log(`Can\'t navigate to dashboard.`));
        console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
        return;
      });
  }

  clear(): void {
    this.formGroup.reset();
    this.newPasswordVisible = false;
    this.nzLoading = false;
    this.resetAlert = null;
    this.progress = 0;
    this.status = 'pool';
  }

  reset(resetInterface: ResetInterface): void {
    this.nzLoading = true;
    if (resetInterface.new_password === '') {
      this.formGroup.get('confirm_password')?.setErrors(null);
      this.formGroup.get('confirm_password')?.markAsTouched();
      this.formGroup.get('confirm_password')?.setValue('');
    } else if (resetInterface.new_password !== resetInterface.confirm_password) {
      this.formGroup.get('confirm_password')?.setErrors({ confirmed: true });
    }
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

    delete resetInterface.confirm_password;
    this.authService.reset(resetInterface)
      .subscribe((resetResponseInterface: ResetResponseInterface) => {
        this.nzLoading = false;
        this.nzNotificationService.create('success', 'Success', `${resetResponseInterface?.data?.message}`)
        this.router.navigate(['/login']).catch(() => console.log(`Can\'t navigate to dashboard.`));
      }, (httpErrorResponse: HttpErrorResponse) => {
        this.nzLoading = false;
        if (httpErrorResponse.status === 0) {
          this.resetAlert = {
            type: 'error', message: `Please check your connection and try again.`
          };
        } else if (httpErrorResponse.status === 500) {
          this.resetAlert = {
            type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
          };
        } else {
          this.resetAlert = {
            type: 'error', message: httpErrorResponse?.error?.error?.message
          };
        }
        console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
      });
  }
}
