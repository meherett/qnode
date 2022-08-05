import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { StorageService } from '../../../../services/storage/storage.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { UserService } from '../../../../services/user/user.service';
import { AuthService } from '../../../../services/auth/auth.service';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ResetOldPasswordInterface } from '../setting.interface';
import { RegisterResponseInterface } from '../../../auth/register/register.interface';

@Component({
  selector: 'app-password',
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.less']
})
export class PasswordComponent implements OnInit, OnChanges {

  formGroup: FormGroup;
  passwordVisible: boolean;
  nzLoading: boolean;
  resetOldPasswordAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };

  @Input() userResponseInterface: any;

  ngOnChanges(changes: SimpleChanges) {
  }

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
    if (formControl.value !== formControl.parent!.get('password')!.value) {
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
    public storageService: StorageService,
    private formBuilder: FormBuilder,
    private nzNotificationService: NzNotificationService,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.formGroup = this.formBuilder.group({
      old_password: [null, [Validators.required]],
      password: [null, [Validators.required, Validators.minLength(8), this.checkPassword.bind(this)]],
      confirm_password: [null, [Validators.required, Validators.minLength(8), this.confirmPassword]]
    });
    this.passwordVisible = false;
    this.nzLoading = false;
    this.resetOldPasswordAlert = null;
    this.visible = false;
    this.progress = 0;
    this.status = 'pool';
    this.passwordProgressMap = {
      ok: 'success', pass: 'normal', pool: 'exception'
    };
    this.userResponseInterface = null;
  }

  ngOnInit(): void {
  }

  clear(): void {
    this.formGroup.reset();
    this.passwordVisible = false;
    this.nzLoading = false;
    this.resetOldPasswordAlert = null;
    this.progress = 0;
    this.status = 'pool';
  }

  resetOldPassword(resetOldPasswordInterface: ResetOldPasswordInterface): void {
    this.nzLoading = true;
    if (resetOldPasswordInterface.password === '') {
      this.formGroup.get('confirm_password')?.setErrors(null);
      this.formGroup.get('confirm_password')?.markAsTouched();
      this.formGroup.get('confirm_password')?.setValue('');
    } else if (resetOldPasswordInterface.password !== resetOldPasswordInterface.confirm_password) {
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

    delete resetOldPasswordInterface.confirm_password;
    this.authService.resetOldPassword(
      this.storageService.getStorage('user_id'), {
        old_password: resetOldPasswordInterface.old_password,
        new_password: resetOldPasswordInterface.password
      }).subscribe((registerResponseInterface: RegisterResponseInterface) => {
      this.nzLoading = false;
      this.resetOldPasswordAlert = {
        type: 'success', message: registerResponseInterface?.data?.message ? registerResponseInterface?.data?.message : ''
      };
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoading = false;
      if (httpErrorResponse.status === 0) {
        this.resetOldPasswordAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.resetOldPasswordAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.resetOldPasswordAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }
}
