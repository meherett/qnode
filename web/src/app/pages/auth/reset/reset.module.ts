import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResetComponent } from './reset.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NG_ZORRO_MODULES } from '../../../modules/ng-zorro.module';
import { ResetRouting } from './reset.routing';



@NgModule({
  declarations: [
    ResetComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ...NG_ZORRO_MODULES,
    ReactiveFormsModule,
    ResetRouting
  ]
})
export class ResetModule { }
