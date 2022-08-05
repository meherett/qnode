import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../../services/storage/storage.service';
import { ProjectService } from '../../../services/project/project.service';
import {
  NewProjectCollectionResponseInterface,
  ProjectCollectionResponseInterface,
  ProjectResponseInterface
} from './project.interface';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService } from '../../../services/auth/auth.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.less']
})
export class ProjectComponent implements OnInit {

  projectCollectionResponseInterface: null | ProjectCollectionResponseInterface;
  nzSpinning: boolean;

  formGroup: FormGroup;
  isVisible = false;
  newProjectAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };
  projectCollectionAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };
  nzLoading: boolean;
  nzLoadingEmailConfirmation: boolean;

  constructor(
    public title: Title,
    public router: Router,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private nzNotificationService: NzNotificationService,
    public authService: AuthService,
    public storageService: StorageService,
    public projectService: ProjectService
  ) {
    this.projectCollectionResponseInterface = null;
    this.nzSpinning = false;
    this.formGroup = this.formBuilder.group({
      name: [null, [Validators.required, Validators.maxLength(30)]],
      description: [null, [Validators.maxLength(300)]]
    });
    this.newProjectAlert = null;
    this.projectCollectionAlert = null;
    this.nzLoading = false;
    this.nzLoadingEmailConfirmation = false;
  }

  ngOnInit(): void {
    this.title.setTitle('QNode - Projects');
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['page']) {
        this.collection(params['page']);
      } else {
        this.collection(1);
      }
    }, () => {
      this.collection(1);
    });
  }

  reload() {
    window.location.reload();
  }

  showModal(): void {
    this.isVisible = true;
  }

  handleCancel(): void {
    this.isVisible = false;
    this.newProjectAlert = null;
  }

  clear(): void {
    this.formGroup.reset();
    this.nzLoading = false;
    this.newProjectAlert = null;
  }

  collection(pageIndex: number) {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {page: pageIndex},
      queryParamsHandling: 'merge'
    });
    this.projectCollectionResponseInterface = null;
    this.nzSpinning = true;
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.get(`?limit=4&page=${pageIndex}&find-all=false`, headers).subscribe((projectCollectionResponseInterface: ProjectCollectionResponseInterface) => {
        this.projectCollectionResponseInterface = projectCollectionResponseInterface;
        this.nzSpinning = false;
      }, (httpErrorResponse: HttpErrorResponse) => {
        this.nzSpinning = false;
        if (httpErrorResponse.status === 0) {
          this.projectCollectionAlert = {
            type: 'error', message: `Please check your connection and try again.`
          };
        } else if (httpErrorResponse.status === 500) {
          this.projectCollectionAlert = {
            type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
          };
        } else {
          this.projectCollectionAlert = {
            type: 'error', message: httpErrorResponse?.error?.error?.message
          };
        }
        console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
      });
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
          this.nzNotificationService.create('error', 'Error', `Please check your connection or it's server problem. Please, try again later.`);
        } else {
          this.nzNotificationService.create('error', 'Error', `${httpErrorResponse?.error?.error?.message}`);
        }
        console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
      });
  }

  create(data: { name: string, description: string }): void {
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
      .append('Access-Control-Allow-Methods', 'POST')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.create(data, headers).subscribe((
      newProjectCollectionResponseInterface: NewProjectCollectionResponseInterface
    ) => {
      this.nzLoading = false;
      this.collection(1);
      this.nzNotificationService.create('success', 'Success',`${data.name} project created.`);
      this.isVisible = false;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoading = false;
      if (httpErrorResponse.status === 0) {
        this.newProjectAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.newProjectAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.newProjectAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }
}
