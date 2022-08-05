import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from '../../../services/auth/register/register.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService } from '../../../services/auth/auth.service';
import { RegisterInterface, RegisterResponseInterface, EmailIsRegisteredResponseInterface } from './register.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.less']
})
export class RegisterComponent implements OnInit {

  formGroup: FormGroup;
  passwordVisible: boolean;
  nzLoading: boolean;
  registerAlert: null | {
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
    private registerService: RegisterService,
    private formBuilder: FormBuilder,
    private nzNotificationService: NzNotificationService,
    private authService: AuthService
  ) {
    this.formGroup = this.formBuilder.group({
      email: [null, [Validators.required, Validators.email], [this.emailIsRegistered.bind(this)]],
      password: [null, [Validators.required, Validators.minLength(8), this.checkPassword.bind(this)]],
      confirm_password: [null, [Validators.required, Validators.minLength(8), this.confirmPassword]]
    });
    this.passwordVisible = false;
    this.nzLoading = false;
    this.registerAlert = null;
    this.visible = false;
    this.progress = 0;
    this.status = 'pool';
    this.passwordProgressMap = {
      ok: 'success', pass: 'normal', pool: 'exception'
    };
  }

  ngOnInit(): void {
    this.title.setTitle('QNode - Registration');
  }

  public emailIsRegistered(formControl: FormControl): any {
    clearTimeout(this.setTimeout);
    return new Promise(resolve => {
      this.setTimeout = setTimeout(() => {
        this.authService.emailIsRegistered(formControl.value)
          .subscribe((emailIsRegisteredResponseInterface: EmailIsRegisteredResponseInterface | any) => {
            if (emailIsRegisteredResponseInterface.data.valid) {
              resolve(null);
            } else {
              resolve({
                is_registered: emailIsRegisteredResponseInterface.data.is_registered
              });
            }
          },(httpErrorResponse: HttpErrorResponse) => {
            resolve({
              statusCode: httpErrorResponse.status
            });
          });
      }, 1000);
    });
  }

  clear(): void {
    this.formGroup.reset();
    this.passwordVisible = false;
    this.nzLoading = false;
    this.registerAlert = null;
    this.progress = 0;
    this.status = 'pool';
  }

  register(registerInterface: RegisterInterface): void {
    this.nzLoading = true;
    if (registerInterface.password === '') {
      this.formGroup.get('confirm_password')?.setErrors(null);
      this.formGroup.get('confirm_password')?.markAsTouched();
      this.formGroup.get('confirm_password')?.setValue('');
    } else if (registerInterface.password !== registerInterface.confirm_password) {
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

    delete registerInterface.confirm_password;
    this.authService.register(registerInterface)
      .subscribe((registerResponseInterface: RegisterResponseInterface) => {
        this.nzLoading = false;
        this.nzNotificationService.create('success', 'Success', `${registerResponseInterface?.data?.message}`)
        this.router.navigate(['/login']).catch(() => console.log(`Can\'t navigate to dashboard.`));
      }, (httpErrorResponse: HttpErrorResponse) => {
        this.nzLoading = false;
        if (httpErrorResponse.status === 0) {
          this.registerAlert = {
            type: 'error', message: `Please check your connection and try again.`
          };
        } else if (httpErrorResponse.status === 500) {
          this.registerAlert = {
            type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
          };
        } else {
          this.registerAlert = {
            type: 'error', message: httpErrorResponse?.error?.error?.message
          };
        }
        console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
      });
  }
}
