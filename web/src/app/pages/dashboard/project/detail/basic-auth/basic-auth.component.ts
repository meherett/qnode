import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectResponseInterface } from '../../project.interface';
import { ProjectService } from '../../../../../services/project/project.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-basic-auth',
  templateUrl: './basic-auth.component.html',
  styleUrls: ['./basic-auth.component.less']
})
export class BasicAuthComponent implements OnInit {

  nzLoadingAdd: boolean;
  nzLoadingRemove: boolean;
  formGroup: FormGroup;
  @Input() projectResponseInterface: any | ProjectResponseInterface;
  passwordVisible: boolean;

  basicAuthAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };

  ngOnChanges(changes: SimpleChanges) {
  }

  constructor(
    public projectService: ProjectService,
    public nzNotificationService: NzNotificationService,
    private formBuilder: FormBuilder
  ) {
    this.formGroup = this.formBuilder.group({
      username: [null, [Validators.required, Validators.maxLength(100)]],
      password: [null, [Validators.required, Validators.maxLength(100)]]
    });
    this.basicAuthAlert = null;
    this.nzLoadingAdd = false;
    this.nzLoadingRemove = false;
    this.passwordVisible = false;
  }

  ngOnInit(): void {
  }

  clear(): void {
    this.formGroup.reset();
    this.nzLoadingAdd = false;
    this.nzLoadingRemove = false;
    this.basicAuthAlert = null;
  }

  addBasicAuth(_id: string | any, data: { username: string, password: string }) {
    this.nzLoadingAdd = true;
    for (const index in this.formGroup?.controls) {
      if (this.formGroup?.controls[index]?.invalid) {
        this.formGroup?.controls[index]?.markAsDirty();
        this.formGroup?.controls[index]?.updateValueAndValidity();
      }
    }
    for (const index in this.formGroup?.controls) {
      if (this.formGroup?.controls[index]?.invalid) {
        this.nzLoadingAdd = false;
        return;
      }
    }

    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.create(data, headers, `/${_id}/add-basic-auth`).subscribe((
      projectUpdatedResponseInterface: any
    ) => {
      this.projectResponseInterface = projectUpdatedResponseInterface;
      this.basicAuthAlert = {
        type: 'success', message: `Successfully new Basic authentication added.`
      };
      this.formGroup.reset();
      this.nzLoadingAdd = false;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingAdd = false;
      if (httpErrorResponse.status === 0) {
        this.basicAuthAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.basicAuthAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.basicAuthAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }

  removeBasicAuth(_id: string | any, username: string) {
    this.nzLoadingRemove = true;
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.delete(`/${_id}`, headers, `/remove-basic-auth/${username}`).subscribe((
      projectUpdatedResponseInterface: any
    ) => {
      this.projectResponseInterface = projectUpdatedResponseInterface;
      this.basicAuthAlert = {
        type: 'success', message: `Successfully Basic authentication '${username}' removed.`
      };
      this.nzLoadingRemove = false;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingRemove = false;
      if (httpErrorResponse.status === 0) {
        this.basicAuthAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.basicAuthAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.basicAuthAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }
}
