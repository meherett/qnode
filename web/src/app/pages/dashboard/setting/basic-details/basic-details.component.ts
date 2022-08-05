import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../../../services/storage/storage.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../../services/user/user.service';
import { EmailIsRegisteredResponseInterface } from '../../../auth/register/register.interface';
import { AuthService } from '../../../../services/auth/auth.service';

@Component({
  selector: 'app-basic-details',
  templateUrl: './basic-details.component.html',
  styleUrls: ['./basic-details.component.less']
})
export class BasicDetailsComponent implements OnInit, OnChanges {

  formGroup: FormGroup;
  passwordVisible: boolean;
  _id_or_key: string;
  nzLoading: boolean;
  setTimeout: any;

  basicDetailAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };

  @Input() userResponseInterface: any = null;

  ngOnChanges(changes: SimpleChanges) {
    this.formGroup.get('email')?.setValue(this.userResponseInterface?.data?.email);
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public storageService: StorageService,
    public userService: UserService,
    public authService: AuthService,
    private formBuilder: FormBuilder
  ) {
    this.formGroup = this.formBuilder.group({
      email: [null, [Validators.required, Validators.email], [this.emailIsRegistered.bind(this)]],
      password: [null, [Validators.required]]
    });
    this.passwordVisible = false;
    this._id_or_key = activatedRoute.snapshot.params._id_or_key;
    this.nzLoading = false;
    this.basicDetailAlert = null;
  }

  ngOnInit(): void {
  }

  clear(): void {
    this.passwordVisible = false;
    this.formGroup.reset();
    this.nzLoading = false;
    this.basicDetailAlert = null;
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

  update(_id: string | any, data: { email: string, password: string }) {
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

    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.userService.update(`/${_id}`, data, headers).subscribe((
      userUpdatedResponseInterface: any
    ) => {
      this.nzLoading = false;
      if (!userUpdatedResponseInterface?.data?.is_confirmed) {
        this.basicDetailAlert = {
          type: 'success', message: `Successfully updated, just confirm your updated email address.`
        };
      }
      this.storageService.setStorage('email', userUpdatedResponseInterface?.data?.email);
      this.storageService.setStorage('is_confirmed', userUpdatedResponseInterface?.data?.is_confirmed);
      this.formGroup.get('email')?.setValue(null);
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoading = false;
      if (httpErrorResponse.status === 0) {
        this.basicDetailAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.basicDetailAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.basicDetailAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }
}
