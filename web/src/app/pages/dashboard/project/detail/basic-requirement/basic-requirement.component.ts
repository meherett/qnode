import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from "@angular/forms";
import { ProjectResponseInterface } from "../../project.interface";
import { ProjectService } from "../../../../../services/project/project.service";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { HttpErrorResponse, HttpHeaders } from "@angular/common/http";


@Component({
  selector: 'app-basic-requirement',
  templateUrl: './basic-requirement.component.html',
  styleUrls: ['./basic-requirement.component.less']
})
export class BasicRequirementComponent implements OnInit {

  formGroupUseBasicAuth: FormGroup;
  @Input() projectResponseInterface: any | ProjectResponseInterface;

  ngOnChanges(changes: SimpleChanges) {
    this.formGroupUseBasicAuth.get('use_basic_auth')?.setValue(this.projectResponseInterface?.data?.security?.use_basic_auth);
  }

  constructor(
    public projectService: ProjectService,
    public nzNotificationService: NzNotificationService,
    private formBuilder: FormBuilder
  ) {
    this.formGroupUseBasicAuth = this.formBuilder.group({
      use_basic_auth: [null]
    });
  }

  ngOnInit(): void {
  }

  updateUseBasicAuth(_id: string | any, data: { use_basic_auth: boolean }) {
    for (const index in this.formGroupUseBasicAuth?.controls) {
      if (this.formGroupUseBasicAuth?.controls[index]?.invalid) {
        this.formGroupUseBasicAuth?.controls[index]?.markAsDirty();
        this.formGroupUseBasicAuth?.controls[index]?.updateValueAndValidity();
      }
    }
    for (const index in this.formGroupUseBasicAuth?.controls) {
      if (this.formGroupUseBasicAuth?.controls[index]?.invalid) {
        return;
      }
    }

    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.update(`/${_id}`, { 'security.use_basic_auth': data.use_basic_auth }, headers).subscribe((
      projectUpdatedResponseInterface: any
    ) => {
      this.projectResponseInterface = projectUpdatedResponseInterface;
      this.formGroupUseBasicAuth.get('use_basic_auth')?.setValue(this.projectResponseInterface?.data?.security?.use_basic_auth);
      this.nzNotificationService.create('success', 'Success', `Basic authentication ${this.projectResponseInterface?.data?.security?.use_basic_auth ? 'enabled' : 'disabled'}.`);
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.formGroupUseBasicAuth.get('use_basic_auth')?.setValue(this.projectResponseInterface?.data?.security?.use_basic_auth);
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
