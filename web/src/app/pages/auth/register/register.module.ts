import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NG_ZORRO_MODULES } from '../../../modules/ng-zorro.module';
import { RegisterComponent } from './register.component';
import { RegisterRouting } from './register.routing';


@NgModule({
  declarations: [
    RegisterComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ...NG_ZORRO_MODULES,
    ReactiveFormsModule,
    RegisterRouting
  ]
})
export class RegisterModule { }
