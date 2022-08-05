import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectComponent } from './project.component';
import { DetailComponent } from './detail/detail.component';
import { NG_ZORRO_MODULES } from '../../../modules/ng-zorro.module';
import { ProjectRouting } from './project.routing';
import { ShortNumbersPipe } from './pipes/short-numbers.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClipboardService } from 'ngx-clipboard';
import { ProjectService } from '../../../services/project/project.service';
import { EllipsisModule } from 'ngx-ellipsis';
import { BasicAuthComponent } from './detail/basic-auth/basic-auth.component';
import { JwtAuthComponent } from './detail/jwt-auth/jwt-auth.component';
import { RequestsComponent } from './detail/requests/requests.component';
import { AllowedUserAgentComponent } from './detail/allowed-user-agent/allowed-user-agent.component';
import { AllowedOriginComponent } from './detail/allowed-origin/allowed-origin.component';
import { AllowedMethodComponent } from './detail/allowed-method/allowed-method.component';
import { BasicRequirementComponent } from './detail/basic-requirement/basic-requirement.component';
import { JwtRequirementComponent } from './detail/jwt-requirement/jwt-requirement.component';


@NgModule({
  declarations: [
    ProjectComponent,
    DetailComponent,
    ShortNumbersPipe,
    BasicAuthComponent,
    JwtAuthComponent,
    RequestsComponent,
    AllowedUserAgentComponent,
    AllowedOriginComponent,
    AllowedMethodComponent,
    BasicRequirementComponent,
    JwtRequirementComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ...NG_ZORRO_MODULES,
    EllipsisModule,
    ProjectRouting
  ],
  providers: [
    ProjectService,
    ClipboardService
  ],
  exports: [
    FormsModule
  ]
})
export class ProjectModule { }
