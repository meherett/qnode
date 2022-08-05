import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { StorageService } from '../../services/storage/storage.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.less']
})
export class ConfirmEmailComponent implements OnInit {

  token: string;
  nzLoading = false;
  confirmEmailAlert: { type: 'success' | 'warning' | 'error', message: string } | null;

  constructor(
    public title: Title,
    public router: Router,
    private activatedRoute: ActivatedRoute,
    public storageService: StorageService,
    private nzNotificationService: NzNotificationService,
    private authService: AuthService
  ) {
    this.token = activatedRoute.snapshot.params.token;
    this.confirmEmailAlert = null;
  }

  ngOnInit(): void {
    this.title.setTitle('QNode - Confirm Email Address');
    this.confirmEmail(this.token);
  }

  confirmEmail(token: string) {
    this.nzLoading = true;
    this.authService.confirmEmail(token)
      .subscribe((data: any) => {
        console.log(data);
        this.nzLoading = false;
        this.confirmEmailAlert = { type: 'success', message: data?.data?.message };
        if (this.storageService.getStorage('email') === data?.data?.email) {
          this.storageService.setStorage('email', data?.data?.email);
          this.storageService.setStorage('is_confirmed', data?.data?.is_confirmed);
        }
      }, (httpErrorResponse: HttpErrorResponse) => {
        this.nzLoading = false;
        if (httpErrorResponse.status === 0) {
          this.confirmEmailAlert = {
            type: 'error', message: `Please check your connection and try again.`
          };
        } else if (httpErrorResponse.status === 500) {
          this.confirmEmailAlert = {
            type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
          };
        } else {
          this.confirmEmailAlert = {
            type: 'error', message: httpErrorResponse?.error?.error?.message
          };
        }
        console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
      });
  }
}
