import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../../../services/storage/storage.service';
import { UserService } from '../../../../services/user/user.service';
import { AuthService } from '../../../../services/auth/auth.service';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.less']
})
export class ProfileComponent implements OnInit, OnChanges {

  formGroup: FormGroup;
  _id_or_key: string;
  nzLoading: boolean;

  profileAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };

  @Input() userResponseInterface: any = null;

  optionsYourRole: { label: string, value: 'engineer-developer' | 'it-sysadmin-devops' | 'manager-director' | 'founder-executive' } [] = [
    { label: 'Engineer / Developer', value: 'engineer-developer' },
    { label: 'IT / SysAdmin / DevOps', value: 'it-sysadmin-devops' },
    { label: 'Manager / Director', value: 'manager-director' },
    { label: 'Founder / Executive', value: 'founder-executive' }
  ];
  selectedYourRole: { label: string, value: 'engineer-developer' | 'it-sysadmin-devops' | 'manager-director' | 'founder-executive' } = {
    label: 'Engineer / Developer', value: 'engineer-developer'
  };

  optionsOrganizationSize: { label: string, value: '1' | '2-25' | '25-100' | '101-500' | '500+' } [] = [
    { label: 'Solo / Freelancer (1)', value: '1' },
    { label: 'Small Startup (2-25)', value: '2-25' },
    { label: 'Large Startup (25-100)', value: '25-100' },
    { label: 'Mid-Market (101-500)', value: '101-500' },
    { label: 'Enterprise (500+)', value: '500+' },
  ];
  selectedOrganizationSize: { label: string, value: '1' | '2-25' | '25-100' | '101-500' | '500+' } = {
    label: 'Solo. Freelancer (1)', value: '1'
  };

  optionsOrganizationCategory: { label: string, value: 'nft-collectibles' | 'transactions-wallets' | 'gaming' | 'defi-financial-products' | 'dao' | 'blockchain-l2' | 'media' | 'sport' | 'metaverse' | 'infrastructure' | 'consulting' } [] = [
    { label: 'NFT / Collectibles', value: 'nft-collectibles' },
    { label: 'Transactions / Wallets', value: 'transactions-wallets' },
    { label: 'Gaming', value: 'gaming' },
    { label: 'DeFi / Financial Products', value: 'defi-financial-products' },
    { label: 'DAO', value: 'dao' },
    { label: 'Blockchain / L2', value: 'blockchain-l2' },
    { label: 'Media', value: 'media' },
    { label: 'Sport', value: 'sport' },
    { label: 'Infrastructure', value: 'infrastructure' },
    { label: 'Consulting', value: 'consulting' }
  ];
  selectedOrganizationCategory: { label: string, value: 'nft-collectibles' | 'transactions-wallets' | 'gaming' | 'defi-financial-products' | 'dao' | 'blockchain-l2' | 'media' | 'sport' | 'metaverse' | 'infrastructure' | 'consulting' } = {
    label: 'nft-collectibles', value: 'nft-collectibles'
  };

  ngOnChanges(changes: SimpleChanges) {
    this.formGroup.get('name')?.setValue(this.userResponseInterface?.data?.organization?.name);
    this.formGroup.get('url')?.setValue(this.userResponseInterface?.data?.organization?.url);
    this.formGroup.get('role')?.setValue(this.userResponseInterface?.data?.organization?.role);
    this.formGroup.get('size')?.setValue(this.userResponseInterface?.data?.organization?.size);
    this.formGroup.get('category')?.setValue(this.userResponseInterface?.data?.organization?.category);
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public storageService: StorageService,
    public userService: UserService,
    public authService: AuthService,
    private formBuilder: FormBuilder
  ) {
    this.formGroup = this.formBuilder.group({
      name: [null, [Validators.maxLength(100)]],
      url: [null, [Validators.maxLength(100)]],
      role: [null, [Validators.required, Validators.maxLength(100)]],
      size: [null, [Validators.required, Validators.maxLength(100)]],
      category: [null, [Validators.required, Validators.maxLength(100)]]
    });
    this._id_or_key = activatedRoute.snapshot.params._id_or_key;
    this.nzLoading = false;
    this.profileAlert = null;
  }

  ngOnInit(): void {
    // this.formGroup.get('email')?.setValue(this.storageService.getStorage('email'));
  }

  clear(): void {
    this.formGroup.reset();
    this.nzLoading = false;
    this.profileAlert = null;
  }

  update(_id: string | any, data: { name: string, url: string, role: string, size: string, category: string }) {
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
    this.userService.update(`/${_id}`, { organization: data }, headers).subscribe((
      userUpdatedResponseInterface: any
    ) => {
      this.nzLoading = false;
      this.profileAlert = {
        type: 'success', message: `Successfully your profile is updated.`
      };
      this.formGroup.get('name')?.setValue(userUpdatedResponseInterface?.data?.organization?.name);
      this.formGroup.get('url')?.setValue(userUpdatedResponseInterface?.data?.organization?.url);
      this.formGroup.get('role')?.setValue(userUpdatedResponseInterface?.data?.organization?.role);
      this.formGroup.get('size')?.setValue(userUpdatedResponseInterface?.data?.organization?.size);
      this.formGroup.get('category')?.setValue(userUpdatedResponseInterface?.data?.organization?.category);
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoading = false;
      if (httpErrorResponse.status === 0) {
        this.profileAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.profileAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.profileAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }
}
