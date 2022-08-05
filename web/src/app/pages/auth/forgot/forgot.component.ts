import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ForgotInterface, ForgotResponseInterface } from './forgot.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.less']
})
export class ForgotComponent implements OnInit {

  formGroup: FormGroup;
  passwordVisible: boolean;
  nzLoading: boolean;
  forgotAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };

  constructor (
    public title: Title,
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private nzNotificationService: NzNotificationService
  ) {
    this.formGroup = this.formBuilder.group({
      email: [null, [Validators.required, Validators.email]]
    });
    this.passwordVisible = false;
    this.nzLoading = false;
    this.forgotAlert = null;
  }

  ngOnInit(): void {
    this.title.setTitle('QNode - Forgot Password');
  }

  clear(): void {
    this.formGroup.reset();
    this.passwordVisible = false;
    this.nzLoading = false;
    this.forgotAlert = null;
  }

  forgot(forgotInterface: ForgotInterface): void {
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

    this.authService.forgot(forgotInterface)
      .subscribe((forgotResponseInterface: ForgotResponseInterface) => {
        this.nzLoading = false;
        this.nzNotificationService.create('success', 'Success', `${forgotResponseInterface?.data?.message}`);
        this.router.navigate(['/login']).catch(() => console.log(`Can\'t navigate to dashboard.`));
      }, (httpErrorResponse: HttpErrorResponse) => {
        this.nzLoading = false;
        if (httpErrorResponse.status === 0) {
          this.forgotAlert = {
            type: 'error', message: `Please check your connection and try again.`
          };
        } else if (httpErrorResponse.status === 500) {
          this.forgotAlert = {
            type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
          };
        } else {
          this.forgotAlert = {
            type: 'error', message: httpErrorResponse?.error?.error?.message
          };
        }
        console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
      });
  }
}
