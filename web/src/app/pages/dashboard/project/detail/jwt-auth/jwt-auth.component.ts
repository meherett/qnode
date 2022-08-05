import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectResponseInterface } from '../../project.interface';
import { ProjectService } from '../../../../../services/project/project.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ClipboardService } from "ngx-clipboard";

@Component({
  selector: 'app-jwt-auth',
  templateUrl: './jwt-auth.component.html',
  styleUrls: ['./jwt-auth.component.less']
})
export class JwtAuthComponent implements OnInit {

  nzLoadingAdd: boolean;
  nzLoadingRemove: boolean;
  formGroup: FormGroup;
  @Input() projectResponseInterface: any | ProjectResponseInterface;

  jwtAuthAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };

  ngOnChanges(changes: SimpleChanges) {
  }

  copy(key: string, name: string) {
    this.clipboardService.copy(key);
    this.nzNotificationService.create('success', 'Success',`Copied '${name}' credential key!`);
  }

  constructor(
    public clipboardService: ClipboardService,
    public projectService: ProjectService,
    public nzNotificationService: NzNotificationService,
    private formBuilder: FormBuilder
  ) {
    this.formGroup = this.formBuilder.group({
      name: [null, [Validators.required, Validators.maxLength(100)]],
      public_key: [null, [Validators.required]]
    });
    this.jwtAuthAlert = null;
    this.nzLoadingAdd = false;
    this.nzLoadingRemove = false;
  }

  ngOnInit(): void {
  }

  // cleanPublicBeginAndEnd(data: string) {
  //   console.log(data, this.formGroup.get('public_key'));
  //   let bpk: string = data.replace('-----BEGIN PUBLIC KEY-----', '');
  //   let epk: string = bpk.replace('-----END PUBLIC KEY-----', '');
  //   this.formGroup.get('public_key')?.setValue(data + 'epk', { emitEvent: false })
  // }

  clear(): void {
    this.formGroup.reset();
    this.nzLoadingAdd = false;
    this.nzLoadingRemove = false;
    this.jwtAuthAlert = null;
  }

  addJWTAuth(_id: string | any, data: { name: string, public_key: string }) {
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
    this.projectService.create(data, headers, `/${_id}/add-jwt-auth`).subscribe((
      projectUpdatedResponseInterface: any
    ) => {
      this.projectResponseInterface = projectUpdatedResponseInterface;
      this.jwtAuthAlert = {
        type: 'success', message: `Successfully new JWT authentication added.`
      };
      this.formGroup.reset();
      this.nzLoadingAdd = false;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingAdd = false;
      if (httpErrorResponse.status === 0) {
        this.jwtAuthAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.jwtAuthAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.jwtAuthAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }

  removeJWTAuth(_id: string | any, key: string) {
    this.nzLoadingRemove = true;
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.delete(`/${_id}`, headers, `/remove-jwt-auth/${key}`).subscribe((
      projectUpdatedResponseInterface: any
    ) => {
      this.projectResponseInterface = projectUpdatedResponseInterface;
      this.jwtAuthAlert = {
        type: 'success', message: `Successfully JWT authentication '${key}' removed.`
      };
      this.nzLoadingRemove = false;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingRemove = false;
      if (httpErrorResponse.status === 0) {
        this.jwtAuthAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.jwtAuthAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.jwtAuthAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }
}
