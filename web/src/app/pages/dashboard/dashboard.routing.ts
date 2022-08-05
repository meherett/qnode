import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardComponent } from "../../layouts/dashboard/dashboard.component";
import { DetailComponent } from './project/detail/detail.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    pathMatch: 'prefix',
    children: [
      {
        path: '',
        redirectTo: 'project',
        pathMatch: 'full'
      },
      {
        path: 'project',
        loadChildren: () => import('./project/project.module').then((module) => module.ProjectModule),
        pathMatch: 'full'
      },
      {
        path: 'project/:_id_or_key',
        component: DetailComponent,
        pathMatch: 'full'
      },
      {
        path: 'settings',
        loadChildren: () => import('./setting/setting.module').then((module) => module.SettingModule),
        pathMatch: 'full'
      },
      {
        path: 'stats',
        redirectTo: 'stats/all-projects',
        pathMatch: 'full'
      },
      {
        path: 'stats/:project_id_or_key',
        loadChildren: () => import('./stats/stats.module').then((module) => module.StatsModule),
        pathMatch: 'full'
      }
    ]
  }];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class DashboardRouting { }
