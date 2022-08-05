import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsComponent } from './stats.component';
import { NG_ZORRO_MODULES } from '../../../modules/ng-zorro.module';
import { StatsRouting } from './stats.routing';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';


@NgModule({
  declarations: [
    StatsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgChartsModule,
    ...NG_ZORRO_MODULES,
    StatsRouting
  ]
})
export class StatsModule { }
