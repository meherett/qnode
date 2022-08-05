import { Component, HostListener, OnInit } from '@angular/core';
import { StorageService } from '../../services/storage/storage.service';

@Component({
  selector: 'app-layout-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent implements OnInit {

  screenHeight: number;
  screenWidth: number;

  constructor(
    public storageService: StorageService
  ) {
    this.screenHeight = window.innerHeight - 1;
    this.screenWidth = window.innerWidth;
  }

  ngOnInit(): void {
  }

  @HostListener('window:resize')
  getResize(): void {
    this.screenHeight = window.innerHeight - 1;
    this.screenWidth = window.innerWidth;
  }
}
