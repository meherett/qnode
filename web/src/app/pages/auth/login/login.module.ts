import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NG_ZORRO_MODULES } from '../../../modules/ng-zorro.module';
import { LoginComponent } from './login.component';
import { LoginRouting } from './login.routing';


@NgModule({
  declarations: [
    LoginComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ...NG_ZORRO_MODULES,
    LoginRouting
  ]
})
export class LoginModule { }
