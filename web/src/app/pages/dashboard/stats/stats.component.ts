import { Component, OnInit } from '@angular/core';
import { ProjectCollectionResponseInterface, ProjectResponseInterface } from '../project/project.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../../services/storage/storage.service';
import { ProjectService } from '../../../services/project/project.service';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth/auth.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Title } from '@angular/platform-browser';
import { ChartConfiguration, ChartType } from 'chart.js';
import { StatisticsService } from '../../../services/statistics/statistics.service';
import { NzResultStatusType } from 'ng-zorro-antd/result';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.less']
})
export class StatsComponent implements OnInit {

  switchRequestsVolumeDetail: boolean;
  project_id_or_key: string;
  totalMethodsVolume: string [] | null = null;
  totalNetworksVolume: string [] | null = null;

  nzSpinningEmailConfirmation: boolean;
  nzSpinningRequestsVolume: boolean;
  nzSpinningMethodsVolume: boolean;
  nzSpinningNetworksVolume: boolean;
  nzSpinningRequestsActivity: boolean;

  nzLoadingProjects: boolean;

  requestsVolumeErrorMessage: null | { type: NzResultStatusType, message: string };
  methodsVolumeErrorMessage: null | { type: NzResultStatusType, message: string };
  networksVolumeErrorMessage: null | { type: NzResultStatusType, message: string };
  requestsActivityErrorMessage: null | { type: NzResultStatusType, message: string };

  requestsVolumeChartConfigurationData: null | ChartConfiguration['data'];
  methodsVolumeChartConfigurationData: null | ChartConfiguration['data'];
  networksVolumeChartConfigurationData: null | ChartConfiguration['data'];

  requestsVolumeChartConfigurationOptions: ChartConfiguration['options'];
  methodsVolumeChartConfigurationOptions: ChartConfiguration['options'];
  networksVolumeChartConfigurationOptions: ChartConfiguration['options'];

  requestsVolumeChartType: ChartType = 'line'
  methodsVolumeChartType: ChartType = 'line'
  networksVolumeChartType: ChartType = 'line'

  requestsVolumeResponseInterface: null | any;
  methodsVolumeResponseInterface: null | any;
  networksVolumeResponseInterface: null | any;
  requestsActivityResponseInterface: null | any;

  optionsLast: { label: string, value: '15m' | '1h' | '24h' | '7d' |'30d' } [] = [
    { label: 'Last 15 Minutes', value: '15m' },
    { label: 'Last 1 Hour', value: '1h' },
    { label: 'Last 24 Hours', value: '24h' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' }
  ];
  selectedLast: { label: string, value: '15m' | '1h' | '24h' | '7d' |'30d' } = {
    label: 'Last 24 Hours', value: '24h'
  };

  optionsProjectsData: { label: string, value: string } [] = [
    { label: 'All Projects', value: 'all-projects' },
  ];
  selectedProjectData: { label: string, value: string } = {
    label: 'All Projects', value: 'all-projects'
  };
  selectedProjectDataValue: string = this.selectedProjectData.value;

  optionsTops: { label: string, value: number } [] = [
    { label: 'Three (3)', value: 3 },
    { label: 'Five (5)', value: 5 },
    { label: 'Seven (7)', value: 7 }
  ];
  selectedTop: { label: string, value: number } = {
    label: 'Five', value: 5
  };

  optionsNetworks: { label: string, value: 'all-networks' | 'mainnet' |'testnet' } [] = [
    { label: 'All Networks', value: 'all-networks' },
    { label: 'Mainnet', value: 'mainnet' },
    { label: 'Testnet', value: 'testnet' }
  ];
  selectedNetwork: { label: string, value: 'all-networks' | 'mainnet' |'testnet' } = {
    label: 'All Networks', value: 'all-networks'
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
    label: 'All Methods', value: 'all-methods'
  };

  projectListData: any = null;
  projectListAlert: null | {
    type: 'success' | 'info' | 'warning' | 'error', message: string
  };

  percent_calculator(total: number, value: number): number {
    return (value * 100) / total
  }

  reload() {
    window.location.reload();
  }

  onSwitch(): void {
    if (this.switchRequestsVolumeDetail) {
      this.requestsVolumeChartConfigurationData = {
        datasets: [
          {
            data: [
              ...this.requestsVolumeResponseInterface?.data?.invalid_volumes
            ],
            label: 'invalid_requests_volume',
            borderColor: '#f5222d',
            backgroundColor: 'rgba(245,34,45,0.5)',
            pointBackgroundColor: '#f5222d',
            pointBorderColor: '#f5222d',
            pointHoverBackgroundColor: '#f5222d',
            pointHoverBorderColor: '#f5222d',
            fill: 'origin',
          },
          {
            data: [
              ...this.requestsVolumeResponseInterface?.data?.valid_volumes
            ],
            label: 'valid_requests_volume',
            borderColor: '#52c41a',
            backgroundColor: 'rgba(82,196,26,0.5)',
            pointBackgroundColor: '#52c41a',
            pointBorderColor: '#52c41a',
            pointHoverBackgroundColor: '#52c41a',
            pointHoverBorderColor: '#52c41a',
            fill: 'origin',
          }
        ]
      };
    } else {
      this.requestsVolumeChartConfigurationData = {
        datasets: [
          {
            data: [
              ...this.requestsVolumeResponseInterface?.data?.volumes
            ],
            label: 'total_requests_volume',
            borderColor: '#0645f7',
            backgroundColor: 'rgba(6,69,247,0.5)',
            pointBackgroundColor: '#0645f7',
            pointBorderColor: '#0645f7',
            pointHoverBackgroundColor: '#0645f7',
            pointHoverBorderColor: '#0645f7',
            fill: 'origin',
          }
        ]
      }
    }
  }

  change_last(value: '15m' | '1h' | '24h' | '7d' |'30d'): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {last: value},
      queryParamsHandling: 'merge'
    });
    this.getRequestsVolume(this.selectedProjectData.value, value);
    this.getMethodsVolume(this.selectedProjectData.value, value, this.selectedNetwork.value, this.selectedTop.value);
    this.getNetworksVolume(this.selectedProjectData.value, value, this.selectedMethod.value);
    this.getRequestActivity(this.selectedProjectData.value, value);
  }

  change_project(key: string): void {
    this.router.navigate([`/dashboard/stats/${key}`], {
      relativeTo: this.activatedRoute,
      queryParamsHandling: 'merge'
    });

    for (let index = 0; index < this.optionsProjectsData.length; index++) {
      if (key === this.optionsProjectsData[index].value) {
        this.selectedProjectData = this.optionsProjectsData[index];
        break;
      } else {
        this.selectedProjectData = {
          label: 'All Projects', value: 'all-projects'
        };
      }
    }
    this.selectedProjectDataValue = this.selectedProjectData.value;

    this.getRequestsVolume(key, this.selectedLast.value);
    this.getMethodsVolume(key, this.selectedLast.value, this.selectedNetwork.value, this.selectedTop.value);
    this.getNetworksVolume(key, this.selectedLast.value, this.selectedMethod.value);
    this.getRequestActivity(key, this.selectedLast.value);
  }

  change_top(value: number): void {
    this.getMethodsVolume(
      this.selectedProjectData.value, this.selectedLast.value, this.selectedNetwork.value, value
    );
  }

  change_network(value: 'all-networks' | 'mainnet' |'testnet'): void {
    this.getMethodsVolume(
      this.selectedProjectData.value, this.selectedLast.value, value, this.selectedTop.value
    );
  }

  change_method(value: string): void {
    this.getNetworksVolume(
      this.selectedProjectData.value, this.selectedLast.value, value
    );
  }

  get_projects() {
    this.nzLoadingProjects = true;
    this.nzSpinningRequestsVolume = true;
    this.nzSpinningMethodsVolume = true;
    this.nzSpinningNetworksVolume = true;
    this.nzSpinningRequestsActivity = true;
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.projectService.get(`?find-all=true&filter=name,key`, headers).subscribe((projectCollectionResponseInterface: ProjectCollectionResponseInterface) => {
      this.projectListData = projectCollectionResponseInterface.data;
      for (let index = 0; index < this.projectListData.length; index++) {
        this.optionsProjectsData.push({
          label: this.projectListData[index].name, value: this.projectListData[index].key
        })
      }
      this.project_id_or_key = this.activatedRoute.snapshot.params.project_id_or_key;
      for (let index = 0; index < this.optionsProjectsData.length; index++) {
        if (this.project_id_or_key === this.optionsProjectsData[index].value) {
          this.selectedProjectData = this.optionsProjectsData[index];
          break;
        } else {
          this.selectedProjectData = {
            label: 'All Projects', value: 'all-projects'
          };
        }
      }
      this.selectedProjectDataValue = this.selectedProjectData.value;
      this.getRequestsVolume(this.selectedProjectData.value, this.selectedLast.value);
      this.getMethodsVolume(this.selectedProjectData.value, this.selectedLast.value, this.selectedNetwork.value, this.selectedTop.value);
      this.getNetworksVolume(this.selectedProjectData.value, this.selectedLast.value, this.selectedMethod.value);
      this.getRequestActivity(this.selectedProjectData.value, this.selectedLast.value);
      this.nzLoadingProjects = false;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzLoadingProjects = false;
      this.router.navigate([`/dashboard/stats/all-projects`], {
        relativeTo: this.activatedRoute,
        queryParamsHandling: 'merge'
      });
      if (httpErrorResponse.status === 0) {
        this.projectListAlert = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.projectListAlert = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.projectListAlert = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }

  constructor(
    public title: Title,
    public router: Router,
    public httpClient: HttpClient,
    private activatedRoute: ActivatedRoute,
    public storageService: StorageService,
    public projectService: ProjectService,
    public nzNotificationService: NzNotificationService,
    public authService: AuthService,
    public statisticsService: StatisticsService
  ) {
    this.switchRequestsVolumeDetail = false;
    this.totalMethodsVolume = null;
    this.totalNetworksVolume = null;

    this.nzSpinningEmailConfirmation = false;
    this.nzSpinningRequestsVolume = false;
    this.nzSpinningMethodsVolume = false;
    this.nzSpinningNetworksVolume = false;
    this.nzSpinningRequestsActivity = false;

    this.nzLoadingProjects = false;

    this.requestsVolumeErrorMessage = null;
    this.methodsVolumeErrorMessage = null;
    this.networksVolumeErrorMessage = null;
    this.requestsActivityErrorMessage = null;

    this.project_id_or_key = this.activatedRoute.snapshot.params.project_id_or_key;
    this.get_projects();

    this.requestsVolumeChartConfigurationData = null;
    this.methodsVolumeChartConfigurationData = null;
    this.networksVolumeChartConfigurationData = null;

    this.requestsVolumeResponseInterface = null;
    this.methodsVolumeResponseInterface = null;
    this.networksVolumeResponseInterface = null;
    this.requestsActivityResponseInterface = null;

    this.activatedRoute.queryParams.subscribe(params => {
      if (params['last'] === '15m') {
        this.selectedLast = { label: 'Last 15 Minutes', value: '15m' };
      } else if (params['last'] === '1h') {
        this.selectedLast = { label: 'Last 1 Hour', value: '1h' };
      } else if (params['last'] === '24h') {
        this.selectedLast = { label: 'Last 24 Hours', value: '24h' };
      } else if (params['last'] === '7d') {
        this.selectedLast = { label: 'Last 7 Days', value: '7d' };
      } else if (params['last'] === '30d') {
        this.selectedLast = { label: 'Last 30 Days', value: '30d' };
      } else {
        this.selectedLast = { label: 'Last 24 Hours', value: '24h' };
      }

      if (params['network'] === 'all-networks') {
        this.selectedNetwork = { label: 'All Networks', value: 'all-networks' };
      } else if (params['network'] === 'mainnet') {
        this.selectedNetwork = { label: 'Mainnet', value: 'mainnet' };
      } else if (params['network'] === 'testnet') {
        this.selectedNetwork = { label: 'Testnet', value: 'testnet' };
      }
    }, () => {
      this.selectedLast = { label: 'Last 24 Hours', value: '24h' };
      this.selectedNetwork = { label: 'All Networks', value: 'all-networks' };
    });

    this.projectListAlert = null;
  }

  ngOnInit(): void {
    this.title.setTitle('QNode - Statistics');
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        last: this.selectedLast.value
      },
      queryParamsHandling: 'merge'
    });
  }

  sendEmailConfirmation() {
    this.nzSpinningEmailConfirmation = true;
    this.authService.sendEmailConfirmation(this.storageService.getStorage('user_id'))
      .subscribe((data: any) => {
        this.nzSpinningEmailConfirmation = false;
        this.nzNotificationService.create('success', 'Success', `${data?.data?.message}`);
      }, (httpErrorResponse: HttpErrorResponse) => {
        this.nzSpinningEmailConfirmation = false;
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

  getRequestsVolume(project_id_or_key: string, last: '15m' | '1h' | '24h' | '7d' |'30d') {
    this.nzSpinningRequestsVolume = true;
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.statisticsService.get(
      `/requests-volume/${project_id_or_key}?last=${last}`, headers
    ).subscribe((requestsVolumeResponseInterface: any) => {
      this.requestsVolumeResponseInterface = requestsVolumeResponseInterface;
      if (this.switchRequestsVolumeDetail) {
        this.requestsVolumeChartConfigurationData = {
          datasets: [
            {
              data: [
                ...this.requestsVolumeResponseInterface?.data?.invalid_volumes
              ],
              label: 'invalid_requests_volume',
              borderColor: '#f5222d',
              backgroundColor: 'rgba(245,34,45,0.5)',
              pointBackgroundColor: '#f5222d',
              pointBorderColor: '#f5222d',
              pointHoverBackgroundColor: '#f5222d',
              pointHoverBorderColor: '#f5222d',
              fill: 'origin',
            },
            {
              data: [
                ...this.requestsVolumeResponseInterface?.data?.valid_volumes
              ],
              label: 'valid_requests_volume',
              borderColor: '#52c41a',
              backgroundColor: 'rgba(82,196,26,0.5)',
              pointBackgroundColor: '#52c41a',
              pointBorderColor: '#52c41a',
              pointHoverBackgroundColor: '#52c41a',
              pointHoverBorderColor: '#52c41a',
              fill: 'origin',
            }
          ]
        };
      } else {
        this.requestsVolumeChartConfigurationData = {
          datasets: [
            {
              data: [
                ...this.requestsVolumeResponseInterface?.data?.volumes
              ],
              label: 'total_requests_volume',
              borderColor: '#0645f7',
              backgroundColor: 'rgba(6,69,247,0.5)',
              pointBackgroundColor: '#0645f7',
              pointBorderColor: '#0645f7',
              pointHoverBackgroundColor: '#0645f7',
              pointHoverBorderColor: '#0645f7',
              fill: 'origin',
            }
          ]
        }
      }
      this.requestsVolumeChartConfigurationOptions = {
        responsive: false,
        elements: {
          line: {
            tension: 0
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            display: false
          },
        },
        scales: {
          x: {
            title: {
              align: 'center',
              display: true,
              text: 'UTC Timestamp'
            },
            max: this.requestsVolumeResponseInterface?.data?.current_datetime,
            min: this.requestsVolumeResponseInterface?.data?.from_datetime,
            type: 'time',
            time: {
              minUnit: this.requestsVolumeResponseInterface?.data?.datetime_unit,
            },
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              maxTicksLimit: this.requestsVolumeResponseInterface?.data?.length
            }
          },
          y: {
            position: 'left',
            min: 0,
            title: {
              display: false,
              text: 'Requests Volume'
            }
          }
        }
      };
      this.nzSpinningRequestsVolume = false;
      this.requestsVolumeErrorMessage = null;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzSpinningRequestsVolume = false;
      this.requestsVolumeResponseInterface = null;
      if (httpErrorResponse.status === 0) {
        this.requestsVolumeErrorMessage = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.requestsVolumeErrorMessage = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.requestsVolumeErrorMessage = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }

  getMethodsVolume(
    project_id_or_key: string, last: '15m' | '1h' | '24h' | '7d' |'30d', networks: 'all-networks' | 'mainnet' |'testnet', top: number
  ) {
    this.nzSpinningMethodsVolume = true;
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.statisticsService.get(
      `/methods-volume/${project_id_or_key}?last=${last}&network=${networks}&top=${top}`, headers
    ).subscribe((methodsVolumeResponseInterface: any) => {
      this.methodsVolumeResponseInterface = methodsVolumeResponseInterface;
      let i = 0;
      let dataset: any = [
        {
          data: [],
          label: '',
          borderColor: 'green',
          backgroundColor: 'transparent',
          pointBackgroundColor: 'green',
          pointBorderColor: 'green',
          pointHoverBackgroundColor: 'green',
          pointHoverBorderColor: 'green',
          fill: 'origin',
        },
        {
          data: [],
          label: '',
          borderColor: 'blue',
          backgroundColor: 'transparent',
          pointBackgroundColor: 'blue',
          pointBorderColor: 'blue',
          pointHoverBackgroundColor: 'blue',
          pointHoverBorderColor: 'blue',
          fill: 'origin',
        },
        {
          data: [],
          label: '',
          borderColor: 'orange',
          backgroundColor: 'transparent',
          pointBackgroundColor: 'orange',
          pointBorderColor: 'orange',
          pointHoverBackgroundColor: 'orange',
          pointHoverBorderColor: 'orange',
          fill: 'origin',
        },
        {
          data: [],
          label: '',
          borderColor: 'brown',
          backgroundColor: 'transparent',
          pointBackgroundColor: 'brown',
          pointBorderColor: 'brown',
          pointHoverBackgroundColor: 'brown',
          pointHoverBorderColor: 'brown',
          fill: 'origin',
        },
        {
          data: [],
          label: '',
          borderColor: 'purple',
          backgroundColor: 'transparent',
          pointBackgroundColor: 'purple',
          pointBorderColor: 'purple',
          pointHoverBackgroundColor: 'purple',
          pointHoverBorderColor: 'purple',
          fill: 'origin',
        },
        {
          data: [],
          label: '',
          borderColor: 'silver',
          backgroundColor: 'transparent',
          pointBackgroundColor: 'silver',
          pointBorderColor: 'silver',
          pointHoverBackgroundColor: 'silver',
          pointHoverBorderColor: 'silver',
          fill: 'origin',
        },
        {
          data: [],
          label: '',
          borderColor: 'cyan',
          backgroundColor: 'transparent',
          pointBackgroundColor: 'cyan',
          pointBorderColor: 'cyan',
          pointHoverBackgroundColor: 'cyan',
          pointHoverBorderColor: 'cyan',
          fill: 'origin',
        },
      ];
      let new_dataset: any[] = [];
      for (const [method, value] of Object.entries(this.methodsVolumeResponseInterface?.data?.methods_volume)) {
        dataset[i].data = value;
        dataset[i].label = method;
        new_dataset.push(dataset[i])
        i++;
      }
      this.methodsVolumeChartConfigurationData = {
        datasets: [
          ...new_dataset
        ]
      };
      this.methodsVolumeChartConfigurationOptions = {
        responsive: false,
        elements: {
          line: {
            tension: 0
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            display: true
          },
        },
        scales: {
          x: {
            title: {
              align: 'center',
              display: true,
              text: 'UTC Timestamp'
            },
            max: this.methodsVolumeResponseInterface?.data?.current_datetime,
            min: this.methodsVolumeResponseInterface?.data?.from_datetime,
            type: 'time',
            time: {
              minUnit: this.methodsVolumeResponseInterface?.data?.datetime_unit
            },
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              maxTicksLimit: this.methodsVolumeResponseInterface?.data?.length
            }
          },
          y: {
            position: 'left',
            min: 0,
            title: {
              display: false,
              text: 'Volume'
            }
          }
        }
      };

      this.totalMethodsVolume = Object.keys(this.methodsVolumeResponseInterface?.data?.methods);
      this.nzSpinningMethodsVolume = false;
      this.methodsVolumeErrorMessage = null;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzSpinningMethodsVolume = false;
      this.methodsVolumeResponseInterface = null;
      if (httpErrorResponse.status === 0) {
        this.methodsVolumeErrorMessage = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.methodsVolumeErrorMessage = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.methodsVolumeErrorMessage = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }

  getNetworksVolume(project_id_or_key: string, last: '15m' | '1h' | '24h' | '7d' |'30d', method: string) {
    this.nzSpinningNetworksVolume = true;
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.statisticsService.get(
      `/networks-volume/${project_id_or_key}?last=${last}&method=${method}`, headers
    ).subscribe((networksVolumeResponseInterface: any) => {
      this.networksVolumeResponseInterface = networksVolumeResponseInterface;
      let i = 0;
      let dataset: any = [
        {
          data: [],
          label: '',
          borderColor: 'green',
          backgroundColor: 'rgba(0,128,0,0.5)',
          pointBackgroundColor: 'green',
          pointBorderColor: 'green',
          pointHoverBackgroundColor: 'green',
          pointHoverBorderColor: 'green',
          fill: 'origin',
        },
        {
          data: [],
          label: '',
          borderColor: 'orange',
          backgroundColor: 'rgba(255,165,0,0.5)',
          pointBackgroundColor: 'orange',
          pointBorderColor: 'orange',
          pointHoverBackgroundColor: 'orange',
          pointHoverBorderColor: 'orange',
          fill: 'origin',
        }
      ];
      let new_dataset: any[] = [];
      for (const [network, value] of Object.entries(this.networksVolumeResponseInterface?.data?.networks_volume)) {
        dataset[i].data = value;
        dataset[i].label = network;
        new_dataset.push(dataset[i])
        i++;
      }
      this.networksVolumeChartConfigurationData = {
        datasets: [
          ...new_dataset
        ]
      };
      this.networksVolumeChartConfigurationOptions = {
        responsive: false,
        elements: {
          line: {
            tension: 0
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            display: true
          },
        },
        scales: {
          x: {
            title: {
              align: 'center',
              display: true,
              text: 'UTC Timestamp'
            },
            max: this.networksVolumeResponseInterface?.data?.current_datetime,
            min: this.networksVolumeResponseInterface?.data?.from_datetime,
            type: 'time',
            time: {
              minUnit: this.networksVolumeResponseInterface?.data?.datetime_unit,
            },
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              maxTicksLimit: this.networksVolumeResponseInterface?.data?.length
            }
          },
          y: {
            position: 'left',
            min: 0,
            title: {
              display: false,
              text: 'UTC Timestamp'
            }
          }
        }
      };
      this.totalNetworksVolume = Object.keys(this.networksVolumeResponseInterface?.data?.networks);
      this.nzSpinningNetworksVolume = false;
      this.networksVolumeErrorMessage = null;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzSpinningNetworksVolume = false;
      this.networksVolumeResponseInterface = null;
      if (httpErrorResponse.status === 0) {
        this.networksVolumeErrorMessage = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.networksVolumeErrorMessage = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.networksVolumeErrorMessage = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }

  listOfColumn = [
    {
      title: 'Name',
      compare: null,
      priority: false
    },
    {
      title: 'Chinese Score',
      compare: (a: any, b: any) => a.chinese - b.chinese,
      priority: 3
    },
    {
      title: 'Math Score',
      compare: (a: any, b: any) => a.math - b.math,
      priority: 2
    },
    {
      title: 'English Score',
      compare: (a: any, b: any) => a.english - b.english,
      priority: 1
    }
  ];

  getRequestActivity(project_id_or_key: string, last: '15m' | '1h' | '24h' | '7d' |'30d') {
    this.nzSpinningRequestsActivity = true;
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    // @ts-ignore
    this.statisticsService.get(
      `/requests-activity/${project_id_or_key}?last=${last}`, headers
    ).subscribe((requestsActivityResponseInterface: any) => {
      this.requestsActivityResponseInterface = requestsActivityResponseInterface;
      this.nzSpinningRequestsActivity = false;
      this.requestsActivityErrorMessage = null;
    }, (httpErrorResponse: HttpErrorResponse) => {
      this.nzSpinningRequestsActivity = false;
      this.requestsActivityResponseInterface = null;
      if (httpErrorResponse.status === 0) {
        this.requestsActivityErrorMessage = {
          type: 'error', message: `Please check your connection and try again.`
        };
      } else if (httpErrorResponse.status === 500) {
        this.requestsActivityErrorMessage = {
          type: 'error', message: `Something went wrong, our team has been notified. Try again later.`
        };
      } else {
        this.requestsActivityErrorMessage = {
          type: 'error', message: httpErrorResponse?.error?.error?.message
        };
      }
      console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
    });
  }
}
