import { Component, HostListener, OnInit } from '@angular/core';
import { StorageService } from '../../services/storage/storage.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {

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
