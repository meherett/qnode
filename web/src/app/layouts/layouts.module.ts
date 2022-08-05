import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

import { NG_ZORRO_MODULES } from '../modules/ng-zorro.module';
import { IconsModule } from '../modules/icons.module';
import { StorageService } from '../services/storage/storage.service';
import { FullscreenComponent } from './fullscreen/fullscreen.component';
import { PassportComponent } from './passport/passport.component';
import { NavbarComponent as PassportNavbarComponent } from './passport/navbar/navbar.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NavbarComponent as HomeNavbarComponent } from './home/navbar/navbar.component';
import { FooterComponent as HomeFooterComponent } from './home/footer/footer.component';
import { NavbarComponent as DashboardNavbarComponent } from './dashboard/navbar/navbar.component';
import { FooterComponent as DashboardFooterComponent } from './dashboard/footer/footer.component';


@NgModule({
  declarations: [
    FullscreenComponent,
    PassportComponent,
    HomeComponent,
    HomeNavbarComponent,
    HomeFooterComponent,
    DashboardComponent,
    DashboardNavbarComponent,
    DashboardFooterComponent,
    PassportNavbarComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    IconsModule,
    FormsModule,
    ...NG_ZORRO_MODULES,
    TranslateModule
  ],
  providers: [
    StorageService
  ],
  exports: [
    FullscreenComponent,
    PassportComponent,
    HomeComponent,
    HomeNavbarComponent,
    HomeFooterComponent,
    DashboardComponent,
    DashboardNavbarComponent,
    DashboardFooterComponent,
    PassportNavbarComponent
  ]
})
export class LayoutsModule { }
