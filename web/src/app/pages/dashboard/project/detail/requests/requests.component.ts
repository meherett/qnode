import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectResponseInterface } from '../../project.interface';
import { ProjectService } from '../../../../../services/project/project.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.less']
})
export class RequestsComponent implements OnInit, OnChanges {

  formGroup: FormGroup;
  @Input() projectResponseInterface: any | ProjectResponseInterface;
  nzLoadingRequests: boolean;

  requestsAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };

  ngOnChanges(changes: SimpleChanges) {
    this.formGroup.get('per_second_requests')?.setValue(this.projectResponseInterface?.data?.security?.per_second_requests);
    this.formGroup.get('per_day_requests')?.setValue(this.projectResponseInterface?.data?.security?.per_day_requests);
  }

  constructor(
    public projectService: ProjectService,
    public nzNotificationService: NzNotificationService,
    private formBuilder: FormBuilder
  ) {
    this.formGroup = this.formBuilder.group({
      per_second_requests: [null, [Validators.required]],
      per_day_requests: [null, [Validators.required]]
    });
    this.nzLoadingRequests = false;
    this.requestsAlert = null;
  }

  ngOnInit(): void {
  }

  clear(): void {
    this.formGroup.reset();
    this.nzLoadingRequests = false;
    this.requestsAlert = null;
  }

  updateRequests(_id: string | any, data: { per_second_requests: number, per_day_requests: number }) {
    this.nzLoadingRequests = true;
    for (const index in this.formGroup?.controls) {
      if (this.formGroup?.controls[index]?.invalid) {
        this.formGroup?.controls[index]?.markAsDirty();
        this.formGroup?.controls[index]?.updateValueAndValidity();
      }
    }
    for (const index in this.formGroup?.controls) {
      if (this.formGroup?.controls[index]?.invalid) {
        this.nzLoadingRequests = false;
        return;
      }
    }

    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.update(`/${_id}`, {
      'security.per_second_requests': data.per_second_requests,
      'security.per_day_requests': data.per_day_requests
    }, headers).subscribe((
      projectUpdatedResponseInterface: any
    ) => {
      this.projectResponseInterface = projectUpdatedResponseInterface;
      this.nzLoadingRequests = false;
      this.requestsAlert = {
        type: 'success', message: `Successfully request rate-limiting updated.`
      };
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingRequests = false;
      if (httpErrorResponse.status === 0) {
        this.requestsAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.requestsAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.requestsAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }
}
