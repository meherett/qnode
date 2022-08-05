import { Injectable } from '@angular/core';
import { StorageService } from '../storage/storage.service';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  constructor(
    public storageService: StorageService
  ) {
    if (this.storageService.getStorage('theme') !== null) {
      this.loadCss(this.storageService.getStorage('theme')).then();
    } else {
      this.loadCss(environment.defaultTheme).then();
    }
  }

  public getTheme(): string {
    return this.storageService.getStorage('theme');
  }

  public loadCss(theme: string): Promise<Event> {
    return new Promise((resolve, reject) => {
      document.documentElement.classList.add(theme);
      const currentTheme = this.storageService.getStorage('theme');
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = `${theme}.css`;
      style.id = theme;
      style.onload = resolve;
      style.onerror = reject;
      document.head.append(style);
      if (currentTheme !== theme) {
        document.documentElement.classList.remove(currentTheme);
        const removedThemeStyle = document.getElementById(currentTheme);
        if (removedThemeStyle) {
          document.head.removeChild(removedThemeStyle);
        }
      }
      this.storageService.setStorage('theme', theme);
    });
  }
}
