import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmEmailComponent } from './confirm-email.component';
import { ConfirmEmailRouting } from './confirm-email.routing';
import { NG_ZORRO_MODULES } from '../../modules/ng-zorro.module';



@NgModule({
  declarations: [
    ConfirmEmailComponent
  ],
  imports: [
    CommonModule,
    ...NG_ZORRO_MODULES,
    ConfirmEmailRouting
  ]
})
export class ConfirmEmailModule { }
