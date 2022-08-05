import { Component, HostListener, OnInit } from '@angular/core';
import { StorageService } from '../../services/storage/storage.service';
import { Title } from '@angular/platform-browser';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { UserService } from '../../services/user/user.service';

declare let particlesJS: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less']
})
export class HomeComponent implements OnInit {

  screenHeight: number;
  screenWidth: number;

  nzLoadingUser: boolean;

  particlesOptions = JSON.parse('{ "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#0645f7" }, "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 }, "image": { "src": "img/github.svg", "width": 100, "height": 100 } }, "opacity": { "value": 0.5, "random": false, "anim": { "enable": false, "speed": 1, "opacity_min": 0.1, "sync": false } }, "size": { "value": 3, "random": true, "anim": { "enable": false, "speed": 40, "size_min": 0.1, "sync": false } }, "line_linked": { "enable": true, "distance": 200, "color": "#0645f7", "opacity": 0.4, "width": 2 }, "move": { "enable": true, "speed": 2, "direction": "none", "random": true, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 } } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "grab": { "distance": 400, "line_linked": { "opacity": 1 } }, "bubble": { "distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3 }, "repulse": { "distance": 200, "duration": 0.4 }, "push": { "particles_nb": 4 }, "remove": { "particles_nb": 2 } } }, "retina_detect": true }')

  constructor(
    public title: Title,
    public userService: UserService,
    public storageService: StorageService
  ) {
    this.screenHeight = window.innerHeight - 1;
    this.screenWidth = window.innerWidth;

    this.nzLoadingUser = false;
  }

  ngOnInit(): void {
    this.title.setTitle('QNode - Qtum ETH-JSON-RPC Node Provider');
    this.invokeParticles();
    this.getUser();
  }

  public invokeParticles(): void {
    particlesJS('particles-js', this.particlesOptions, function() {});
  }

  getUser() {
    this.nzLoadingUser = true;
    const headers = new HttpHeaders()
      .append('Access-Control-Allow-Origin', '*')
      .append('Access-Control-Allow-Methods', 'GET')
      .append('Access-Control-Allow-Headers', 'Content-Type');
    if (this.storageService.getStorage('user_id')) {
      // @ts-ignore
      this.userService.get(`/${this.storageService.getStorage('user_id')}`, headers).subscribe((userResponseInterface: any) => {
        if (userResponseInterface === undefined || userResponseInterface === null) {
          this.nzLoadingUser = false;
        } else {
          console.log(userResponseInterface);
          this.storageService.setStorage('is_confirmed', userResponseInterface.data.is_confirmed);
          this.nzLoadingUser = false;
        }
      }, (httpErrorResponse: HttpErrorResponse) => {
        this.nzLoadingUser = false;
        // if (httpErrorResponse.status === 0) {
        //   this.nzNotificationService.create('error', 'Error', `Please check your connection and try again.`);
        // } else if (httpErrorResponse.status === 500) {
        //   this.nzNotificationService.create('error', 'Error', `Something went wrong, our team has been notified. Try again later.`);
        // } else {
        //   this.nzNotificationService.create('error', 'Error', `${httpErrorResponse?.error?.error?.message}`);
        // }
        console.log(`Status ${httpErrorResponse.status}`, httpErrorResponse.error, httpErrorResponse)
      });
    }
  }

  @HostListener('window:resize')
  getResize(): void {
    this.screenHeight = window.innerHeight - 1;
    this.screenWidth = window.innerWidth;
  }
}
