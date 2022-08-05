import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectResponseInterface } from '../../project.interface';
import { ProjectService } from '../../../../../services/project/project.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-allowed-method',
  templateUrl: './allowed-method.component.html',
  styleUrls: ['./allowed-method.component.less']
})
export class AllowedMethodComponent implements OnInit {

  nzLoadingAdd: boolean;
  nzLoadingRemove: boolean;
  formGroup: FormGroup;
  @Input() projectResponseInterface: any | ProjectResponseInterface;

  allowedMethodAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };

  optionsMethods: { label: string, value: string } [] = [
    { label: 'web3_clientVersion',  value: 'web3_clientVersion' },
    { label: 'web3_sha3',  value: 'web3_sha3' },
    { label: 'net_version',  value: 'net_version' },
    { label: 'net_listening',  value: 'net_listening' },
    { label: 'net_peerCount',  value: 'net_peerCount' },
    { label: 'eth_protocolVersion',  value: 'eth_protocolVersion' },
    { label: 'eth_chainId',  value: 'eth_chainId' },
    { label: 'eth_mining',  value: 'eth_mining' },
    { label: 'eth_hashrate',  value: 'eth_hashrate' },
    { label: 'eth_gasPrice',  value: 'eth_gasPrice' },
    { label: 'eth_accounts',  value: 'eth_accounts' },
    { label: 'eth_blockNumber',  value: 'eth_blockNumber' },
    { label: 'eth_getBalance',  value: 'eth_getBalance' },
    { label: 'eth_getStorageAt',  value: 'eth_getStorageAt' },
    { label: 'eth_getTransactionCount',  value: 'eth_getTransactionCount' },
    { label: 'eth_getCode',  value: 'eth_getCode' },
    { label: 'eth_sign',  value: 'eth_sign' },
    { label: 'eth_signTransaction',  value: 'eth_signTransaction' },
    { label: 'eth_sendTransaction',  value: 'eth_sendTransaction' },
    { label: 'eth_sendRawTransaction',  value: 'eth_sendRawTransaction' },
    { label: 'eth_call',  value: 'eth_call' },
    { label: 'eth_estimateGas',  value: 'eth_estimateGas' },
    { label: 'eth_getBlockByHash',  value: 'eth_getBlockByHash' },
    { label: 'eth_getBlockByNumber',  value: 'eth_getBlockByNumber' },
    { label: 'eth_getTransactionByHash',  value: 'eth_getTransactionByHash' },
    { label: 'eth_getTransactionByBlockHashAndIndex',  value: 'eth_getTransactionByBlockHashAndIndex' },
    { label: 'eth_getTransactionByBlockNumberAndIndex',  value: 'eth_getTransactionByBlockNumberAndIndex' },
    { label: 'eth_getTransactionReceipt',  value: 'eth_getTransactionReceipt' },
    { label: 'eth_getUncleByBlockHashAndIndex',  value: 'eth_getUncleByBlockHashAndIndex' },
    { label: 'eth_getCompilers',  value: 'eth_getCompilers' },
    { label: 'eth_newFilter',  value: 'eth_newFilter' },
    { label: 'eth_newBlockFilter',  value: 'eth_newBlockFilter' },
    { label: 'eth_uninstallFilter',  value: 'eth_uninstallFilter' },
    { label: 'eth_getFilterChanges',  value: 'eth_getFilterChanges' },
    { label: 'eth_getFilterLogs',  value: 'eth_getFilterLogs' },
    { label: 'eth_getLogs',  value: 'eth_getLogs' },
    { label: 'eth_subscribe',  value: 'eth_subscribe' },
    { label: 'eth_unsubscribe',  value: 'eth_unsubscribe' },
    { label: 'qtum_getUTXOs',  value: 'qtum_getUTXOs' },
    { label: 'dev_gethexaddress',  value: 'dev_gethexaddress' },
    { label: 'dev_fromhexaddress',  value: 'dev_fromhexaddress' },
    { label: 'dev_generatetoaddress',  value: 'dev_generatetoaddress' }
  ];
  selectedMethod: { label: string, value: string } = {
    label: 'web3_clientVersion',  value: 'web3_clientVersion'
  };

  constructor(
    public projectService: ProjectService,
    public nzNotificationService: NzNotificationService,
    private formBuilder: FormBuilder
  ) {
    this.formGroup = this.formBuilder.group({
      method: [null, [Validators.required, Validators.maxLength(200)]]
    });
    this.allowedMethodAlert = null;
    this.nzLoadingAdd = false;
    this.nzLoadingRemove = false;
  }

  ngOnInit(): void {
  }

  clear(): void {
    this.formGroup.reset();
    this.nzLoadingAdd = false;
    this.nzLoadingRemove = false;
    this.allowedMethodAlert = null;
  }

  addAllowedMethod(_id: string | any, data: { method: string }) {
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
      .append('Access-Control-Allow-Method', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.create(data, headers, `/${_id}/add-allowed-method`).subscribe((
      projectUpdatedResponseInterface: any
    ) => {
      this.projectResponseInterface = projectUpdatedResponseInterface;
      this.allowedMethodAlert = {
        type: 'success', message: `Successfully new method added.`
      };
      this.formGroup.reset();
      this.nzLoadingAdd = false;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingAdd = false;
      if (httpErrorResponse.status === 0) {
        this.allowedMethodAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.allowedMethodAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.allowedMethodAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }

  removeAllowedMethod(_id: string | any, data: { method: string }) {
    this.nzLoadingRemove = true;
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Method', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.delete(`/${_id}`, headers, `/remove-allowed-method`, data).subscribe((
      projectUpdatedResponseInterface: any
    ) => {
      this.projectResponseInterface = projectUpdatedResponseInterface;
      this.allowedMethodAlert = {
        type: 'success', message: `Successfully method removed.`
      };
      this.nzLoadingRemove = false;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingRemove = false;
      if (httpErrorResponse.status === 0) {
        this.allowedMethodAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.allowedMethodAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.allowedMethodAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }
}
