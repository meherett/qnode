import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { HomeRouting } from './home.routing';
import { NG_ZORRO_MODULES } from '../../modules/ng-zorro.module';



@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    ...NG_ZORRO_MODULES,
    HomeRouting
  ]
})
export class HomeModule { }
