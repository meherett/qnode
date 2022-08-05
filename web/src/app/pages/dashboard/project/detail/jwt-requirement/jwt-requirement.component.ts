import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from "@angular/forms";
import { ProjectResponseInterface } from "../../project.interface";
import { ProjectService } from "../../../../../services/project/project.service";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { HttpErrorResponse, HttpHeaders } from "@angular/common/http";

@Component({
  selector: 'app-jwt-requirement',
  templateUrl: './jwt-requirement.component.html',
  styleUrls: ['./jwt-requirement.component.less']
})
export class JwtRequirementComponent implements OnInit {

  formGroupUseJWTAuth: FormGroup;
  @Input() projectResponseInterface: any | ProjectResponseInterface;

  ngOnChanges(changes: SimpleChanges) {
    this.formGroupUseJWTAuth.get('use_jwt_auth')?.setValue(this.projectResponseInterface?.data?.security?.use_jwt_auth);
  }

  constructor(
    public projectService: ProjectService,
    public nzNotificationService: NzNotificationService,
    private formBuilder: FormBuilder
  ) {
    this.formGroupUseJWTAuth = this.formBuilder.group({
      use_jwt_auth: [null]
    });
  }

  ngOnInit(): void {
  }

  updateUseJWTAuth(_id: string | any, data: { use_jwt_auth: boolean }) {
    for (const index in this.formGroupUseJWTAuth?.controls) {
      if (this.formGroupUseJWTAuth?.controls[index]?.invalid) {
        this.formGroupUseJWTAuth?.controls[index]?.markAsDirty();
        this.formGroupUseJWTAuth?.controls[index]?.updateValueAndValidity();
      }
    }
    for (const index in this.formGroupUseJWTAuth?.controls) {
      if (this.formGroupUseJWTAuth?.controls[index]?.invalid) {
        return;
      }
    }

    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.update(`/${_id}`, { 'security.use_jwt_auth': data.use_jwt_auth }, headers).subscribe((
      projectUpdatedResponseInterface: any
    ) => {
      this.projectResponseInterface = projectUpdatedResponseInterface;
      this.formGroupUseJWTAuth.get('use_jwt_auth')?.setValue(this.projectResponseInterface?.data?.security?.use_jwt_auth);
      this.nzNotificationService.create('success', 'Success', `JWT authentication ${this.projectResponseInterface?.data?.security?.use_jwt_auth ? 'enabled' : 'disabled'}.`);
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.formGroupUseJWTAuth.get('use_jwt_auth')?.setValue(this.projectResponseInterface?.data?.security?.use_jwt_auth);
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

