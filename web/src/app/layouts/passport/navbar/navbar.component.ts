import { Component, HostListener, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from '../../../services/storage/storage.service';
import { LanguageInterface } from '../../../app.interface';
import { AuthService } from '../../../services/auth/auth.service';
import { ThemeService } from '../../../services/theme/theme.service';


@Component({
  selector: 'app-layout-passport-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.less']
})
export class NavbarComponent implements OnInit {

  screenHeight: number;
  screenWidth: number;
  switchValue: boolean;
  nzSpinningTheme: boolean;

  languageInterfaces: LanguageInterface [] = [
    {
      type: 'en-US',
      text: 'English',
      abbreviation: 'πͺπ³',
    },
    {
      type: 'zh-CN',
      text: 'δΈ­ζ',
      abbreviation: 'π¨π³',
    },
    {
      type: 'ko-KR',
      text: 'νκ΅­μ΄',
      abbreviation: 'π°π΄',
    },
  ];

  languageInterface: LanguageInterface = {
    type: 'en-US',
    text: 'English',
    abbreviation: 'πͺπ³',
  };

  constructor(
    private themeService: ThemeService,
    public translateService: TranslateService,
    public authService: AuthService,
    public storageService: StorageService
  ) {
    this.switchValue = this.storageService.getStorage('theme') !== 'default';
    this.screenHeight = window.innerHeight - 1;
    this.screenWidth = window.innerWidth;
    this.nzSpinningTheme = false;
  }

  ngOnInit(): void {
    this.languageInterface = this.storageService.getJSONStorage('language');
    this.translateService.use(this.languageInterface.type);
  }

  @HostListener('window:resize')
  getResize(): void {
    this.screenHeight = window.innerHeight - 1;
    this.screenWidth = window.innerWidth;
  }

  onSwitch(): void {
    this.nzSpinningTheme = true;
    if (this.switchValue) {
      this.themeService.loadCss('dark').then(() => {
        setTimeout(() => {
          this.nzSpinningTheme = false;
        }, 2000);
        // this.nzMessageService.create('success', 'Successfully switched to dark theme.');
      }, () => {
        setTimeout(() => {
          this.nzSpinningTheme = false;
        }, 2000);
        // this.nzMessageService.create('error', 'Failed to switch dark theme.');
      });
    } else {
      this.themeService.loadCss('default').then().then(() => {
        setTimeout(() => {
          this.nzSpinningTheme = false;
        }, 2000);
        // this.nzMessageService.create('success', 'Successfully switched to light theme.');
      }, () => {
        setTimeout(() => {
          this.nzSpinningTheme = false;
        }, 2000);
        // this.nzMessageService.create('error', 'Failed to switch light theme.');
      });
    }
  }

  changeLanguage(languageInterface: LanguageInterface): void {
    this.translateService.use(languageInterface.type);
    this.storageService.setStorage('language', JSON.stringify(languageInterface));
    this.languageInterface = languageInterface;
  }

  logout() {
    this.authService.logout();
  }
}
