import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../../../services/storage/storage.service';
import { UserService } from '../../../../services/user/user.service';
import { AuthService } from '../../../../services/auth/auth.service';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-email-notifications',
  templateUrl: './email-notifications.component.html',
  styleUrls: ['./email-notifications.component.less']
})
export class EmailNotificationsComponent implements OnInit {

  formGroup: FormGroup;
  @Input() userResponseInterface: any = null;

  ngOnChanges(changes: SimpleChanges) {
    this.formGroup.get('email_notification')?.setValue(this.userResponseInterface?.data?.email_notification);
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public storageService: StorageService,
    public userService: UserService,
    public nzNotificationService: NzNotificationService,
    public authService: AuthService,
    private formBuilder: FormBuilder
  ) {
    this.formGroup = this.formBuilder.group({
      email_notification: [null]
    });
  }

  ngOnInit(): void {
  }

  clear(): void {
    this.formGroup.reset();
  }

  update(_id: string | any, data: { email_notification: boolean }) {
    for (const index in this.formGroup?.controls) {
      if (this.formGroup?.controls[index]?.invalid) {
        this.formGroup?.controls[index]?.markAsDirty();
        this.formGroup?.controls[index]?.updateValueAndValidity();
      }
    }
    for (const index in this.formGroup?.controls) {
      if (this.formGroup?.controls[index]?.invalid) {
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
      this.userResponseInterface = userUpdatedResponseInterface;
      this.formGroup.get('email_notification')?.setValue(this.userResponseInterface?.data?.email_notification);
      this.nzNotificationService.create('success', 'Success', `Notification settings updated.`);
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.formGroup.get('email_notification')?.setValue(this.userResponseInterface?.data?.email_notification);
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
}
