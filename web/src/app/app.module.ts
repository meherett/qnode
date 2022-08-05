import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';

import { AppRouting } from './app.routing';
import { AppComponent } from './app.component';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { en_US } from 'ng-zorro-antd/i18n';
import { ErrorComponent } from './pages/error/error.component';
import { AuthModule } from "./modules/auth.module";
import { NG_ZORRO_MODULES } from './modules/ng-zorro.module';
import { LayoutsModule } from './layouts/layouts.module';
import { ThemeService } from './services/theme/theme.service';
import { NzConfig, NZ_CONFIG } from 'ng-zorro-antd/core/config';

registerLocaleData(en);

export function HttpLoaderFactory(httpClient: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

const nzConfig: NzConfig = {
  notification: {
    // nzPlacement: 'bottomRight'
    nzTop: '84px'
  },
  button: {
    nzSize: 'large'
  }
};

export const AppInitializerProvider = {
  provide: APP_INITIALIZER,
  useFactory: (themeService: ThemeService) => () => {
    return themeService.loadCss(themeService.getTheme());
  },
  deps: [
    ThemeService
  ],
  multi: true
};

@NgModule({
  declarations: [
    AppComponent,
    ErrorComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ...NG_ZORRO_MODULES,
    AuthModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [
          HttpClient
        ]
      },
    }),
    LayoutsModule,
    AppRouting
  ],
  providers: [
    AppInitializerProvider,
    {
      provide: NZ_I18N,
      useValue: en_US,
    },
    {
      provide: NZ_CONFIG,
      useValue: nzConfig
    }
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
