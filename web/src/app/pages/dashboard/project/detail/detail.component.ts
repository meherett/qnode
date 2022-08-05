import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectResponseInterface } from '../project.interface';
import { StorageService } from '../../../../services/storage/storage.service';
import { ProjectService } from '../../../../services/project/project.service';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ClipboardService } from 'ngx-clipboard';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../../services/auth/auth.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.less']
})
export class DetailComponent implements OnInit {

  formGroup: FormGroup;

  _id_or_key: string;
  projectResponseInterface: null | ProjectResponseInterface;
  nzLoading: boolean;
  nzLoadingGetProject: boolean;
  nzLoadingEmailConfirmation: boolean;
  nzLoadingDelete: boolean;

  isVisible = false;
  isDeleteVisible = false;

  options: { label: string, value: string } [] = [
    { label: 'Mainnet', value: 'mainnet' },
    { label: 'Testnet', value: 'testnet' }
  ];
  public selected: { label: string, value: string } = {
    label: 'MAINNET', value: 'mainnet'
  };
  detailAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };
  projectDetailAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };
  detailDeleteAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // compareFn = (o1: any, o2: any): boolean => (o1 && o2 ? o1.value === o2.value : o1 === o2);

  change_network(value: string): void {
    if (value === 'mainnet') {
      this.selected = { label: 'MAINNET', value: 'mainnet' };
    } else {
      this.selected = { label: 'TESTNET', value: 'testnet' };
    }
  }

  reload() {
    window.location.reload();
  }

  showModal(): void {
    this.isVisible = true;
    this.formGroup.get('name')?.setValue(this.projectResponseInterface?.data?.name);
    this.formGroup.get('description')?.setValue(this.projectResponseInterface?.data?.description);
  }

  showDeleteModal(): void {
    this.isDeleteVisible = true;
  }

  handleCancel(): void {
    this.isVisible = false;
    this.detailAlert = null;
  }

  handleDeleteCancel(): void {
    this.isDeleteVisible = false;
    this.detailDeleteAlert = null;
  }

  constructor(
    public title: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public storageService: StorageService,
    public projectService: ProjectService,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private nzNotificationService: NzNotificationService,
    private clipboardService: ClipboardService
  ) {
    this.formGroup = this.formBuilder.group({
      name: [null, [Validators.required, Validators.maxLength(30)]],
      description: [null, [Validators.maxLength(300)]]
    });
    this._id_or_key = activatedRoute.snapshot.params._id_or_key;
    this.projectResponseInterface = null;
    this.nzLoading = false;
    this.nzLoadingGetProject = false;
    this.nzLoadingEmailConfirmation = false;
    this.nzLoadingDelete = false;
    this.detailAlert = null;
    this.projectDetailAlert = null;
    this.detailDeleteAlert = null;
  }

  ngOnInit(): void {
    this.title.setTitle('QNode - Project Setting');
    this.get(this._id_or_key);
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

  clear(): void {
    this.formGroup.reset();
    this.nzLoading = false;
    this.detailAlert = null;
  }

  copy(project_key: string | any, network: string | null, _type: string) {
    if (_type === 'http') {
      this.clipboardService.copy(`http://${network}.qnode.meherett.com/${project_key}`);
      this.nzNotificationService.create('success', 'Success',`Copied the endpoint of ${network} network!`);
    } else if (_type === 'ws') {
      this.clipboardService.copy(`ws://${network}.qnode.meherett.com/${project_key}`);
      this.nzNotificationService.create('success', 'Success',`Copied the endpoint of ${network} network!`);
    } else if (_type === 'project_key') {
      this.clipboardService.copy(project_key);
      this.nzNotificationService.create('success', 'Success',`Copied the project key!`);
    }
  }

  get(_id_or_key: string) {
    this.nzLoadingGetProject = true;
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.get(`/${_id_or_key}`, headers).subscribe((projectResponseInterface: ProjectResponseInterface) => {
      this.projectResponseInterface = projectResponseInterface;
      this.nzLoadingGetProject = false;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingGetProject = false;
      if (httpErrorResponse.status === 0) {
        this.projectDetailAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.projectDetailAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.projectDetailAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }

  update(_id: string | any, data: { name: string, description: string }): void {
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
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.update(`/${_id}`, data, headers).subscribe((
      projectResponseInterface: ProjectResponseInterface
    ) => {
      this.projectResponseInterface = projectResponseInterface;
      this.nzLoading = false;
      this.detailAlert = {
        type: 'success', message: `Successfully name and description updated.`
      };
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoading = false;
      if (httpErrorResponse.status === 0) {
        this.detailAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.detailAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.detailAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }

  delete(_id: string | any): void {
    this.nzLoadingDelete = true;

    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.delete(`/${_id}`, headers).subscribe((
      projectResponseInterface: any
    ) => {
      this.nzLoadingDelete = false;
      this.nzNotificationService.create('success', 'Success',`${_id} project deleted.`);
      this.router.navigate(['/dashboard/project']);
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingDelete = false;
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
