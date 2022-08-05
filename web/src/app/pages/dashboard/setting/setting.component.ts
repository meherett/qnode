import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../../services/storage/storage.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';
import { RegisterInterface, RegisterResponseInterface } from '../../auth/register/register.interface';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ResetOldPasswordInterface } from './setting.interface';
import { UserService } from '../../../services/user/user.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.less']
})
export class SettingComponent implements OnInit {

  nzLoadingGetUser: boolean;
  nzLoadingEmailConfirmation: boolean;

  nzLoadingDeleteUser = false;
  isDeleteVisible = false;
  getUserAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };
  detailDeleteAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };
  userResponseInterface: any;

  reload() {
    window.location.reload();
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
    this.nzLoadingGetUser = false;
    this.nzLoadingEmailConfirmation = false;
    this.getUserAlert = null;
    this.detailDeleteAlert = null;
    this.userResponseInterface = null;
  }

  ngOnInit(): void {
    this.getUser(this.storageService.getStorage('user_id'))
    this.title.setTitle('QNode - Setting');
  }

  showDeleteModal(): void {
    this.isDeleteVisible = true;
  }

  handleDeleteCancel(): void {
    this.isDeleteVisible = false;
    this.detailDeleteAlert = null;
  }

  sendEmailConfirmation() {
    this.nzLoadingEmailConfirmation = true;
    this.authService.sendEmailConfirmation(this.storageService.getStorage('user_id'))
      .subscribe((data: any) => {
      this.nzLoadingEmailConfirmation = false;
      this.nzNotificationService.create('success', 'Success', `${data?.data?.message}`);
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingEmailConfirmation = false;
      if (httpErrorResponse.status === 0) {
        this.nzNotificationService.create('error', 'Error', `Please check your connection and try again.`);
      } else if (httpErrorResponse.status === 500) {
        this.nzNotificationService.create('error', 'Error', `Something went wrong, our team has been notified. Try again later.`);
      } else {
        this.nzNotificationService.create('error', 'Error', `${httpErrorResponse?.error?.error?.message}`);
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }

  getUser(_id: string) {
    this.nzLoadingGetUser = true;
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.userService.get(`/${_id}`, headers).subscribe((userResponseInterface: any) => {
      this.userResponseInterface = userResponseInterface;
      this.nzLoadingGetUser = false;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingGetUser = false;
      if (httpErrorResponse.status === 0) {
        this.getUserAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.getUserAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.getUserAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }

  deleteUser(_id: string | any): void {
    this.nzLoadingDeleteUser = true;
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.userService.delete(`/${_id}`, headers).subscribe((
      dataResponseInterface: any
    ) => {
      this.nzLoadingDeleteUser = false;
      this.nzNotificationService.create('success', 'Success',`${_id} user deleted.`);
      this.authService.logout();
      this.router.navigate(['/']);
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingDeleteUser = false;
      if (httpErrorResponse.status === 0) {
        this.detailDeleteAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.detailDeleteAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.detailDeleteAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }
}
