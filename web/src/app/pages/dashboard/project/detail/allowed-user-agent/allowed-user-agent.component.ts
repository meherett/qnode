import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectResponseInterface } from '../../project.interface';
import { ProjectService } from '../../../../../services/project/project.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-allowed-user-agent',
  templateUrl: './allowed-user-agent.component.html',
  styleUrls: ['./allowed-user-agent.component.less']
})
export class AllowedUserAgentComponent implements OnInit {

  nzLoadingAdd: boolean;
  nzLoadingRemove: boolean;
  formGroup: FormGroup;
  @Input() projectResponseInterface: any | ProjectResponseInterface;

  allowedUserAgentAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };

  constructor(
    public projectService: ProjectService,
    public nzNotificationService: NzNotificationService,
    private formBuilder: FormBuilder
  ) {
    this.formGroup = this.formBuilder.group({
      user_agent: [null, [Validators.required, Validators.maxLength(200)]]
    });
    this.allowedUserAgentAlert = null;
    this.nzLoadingAdd = false;
    this.nzLoadingRemove = false;
  }

  ngOnInit(): void {
  }

  clear(): void {
    this.formGroup.reset();
    this.nzLoadingAdd = false;
    this.nzLoadingRemove = false;
    this.allowedUserAgentAlert = null;
  }

  addAllowedUserAgent(_id: string | any, data: { user_agent: string }) {
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
    this.projectService.create(data, headers, `/${_id}/add-allowed-user-agent`).subscribe((
      projectUpdatedResponseInterface: any
    ) => {
      this.projectResponseInterface = projectUpdatedResponseInterface;
      this.allowedUserAgentAlert = {
        type: 'success', message: `Successfully new user-agent added.`
      };
      this.formGroup.reset();
      this.nzLoadingAdd = false;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingAdd = false;
      if (httpErrorResponse.status === 0) {
        this.allowedUserAgentAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.allowedUserAgentAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.allowedUserAgentAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }

  removeAllowedUserAgent(_id: string | any, data: { user_agent: string }) {
    this.nzLoadingRemove = true;
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.delete(`/${_id}`, headers, `/remove-allowed-user-agent`, data).subscribe((
      projectUpdatedResponseInterface: any
    ) => {
      this.projectResponseInterface = projectUpdatedResponseInterface;
      this.allowedUserAgentAlert = {
        type: 'success', message: `Successfully user-agent removed.`
      };
      this.nzLoadingRemove = false;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingRemove = false;
      if (httpErrorResponse.status === 0) {
        this.allowedUserAgentAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.allowedUserAgentAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.allowedUserAgentAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }
}
