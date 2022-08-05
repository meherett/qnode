import { Component, HostListener, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { StorageService } from '../../services/storage/storage.service';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.less'],
  providers: [Title],
})
export class ErrorComponent implements OnInit {

  screenHeight: number;
  screenWidth: number;

  constructor(
    public title: Title,
    public storageService: StorageService
  ) {
    this.screenHeight = window.innerHeight - 1;
    this.screenWidth = window.innerWidth;
  }

  ngOnInit(): void {
    this.title.setTitle('QNode - Page Not Found');
  }

  @HostListener('window:resize')
  getResize(): void {
    this.screenHeight = window.innerHeight - 1;
    this.screenWidth = window.innerWidth;
  }
}
