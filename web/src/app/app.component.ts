import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { StorageService } from './services/storage/storage.service';
import { LanguageInterface } from './app.interface';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  providers: [
    StorageService
  ]
})
export class AppComponent implements OnInit {

  title = 'qnode-web';

  constructor(
    public translateService: TranslateService,
    public storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.language();
    if (this.storageService.getStorage('isCollapsed') === null) {
      this.storageService.setStorage('isCollapsed', false);
    }
  }

  language(): void {
    if (this.storageService.getStorage('language') !== null) {
      const languageInterface: LanguageInterface = this.storageService.getJSONStorage('language');
      this.translateService.use(languageInterface.type);
    } else {
      const languageInterface: LanguageInterface = {
        type: 'en-US',
        text: 'English',
        abbreviation: '🇪🇳',
      };
      this.translateService.use(languageInterface.type);
      this.storageService.setJSONStorage('language', languageInterface);
    }
  }
}
