import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForgotComponent } from './forgot.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NG_ZORRO_MODULES } from '../../../modules/ng-zorro.module';
import { ForgotRouting } from './forgot.routing';



@NgModule({
  declarations: [
    ForgotComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ...NG_ZORRO_MODULES,
    ReactiveFormsModule,
    ForgotRouting
  ]
})
export class ForgotModule { }
