import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfessionsPage } from './confessions.page';

const routes: Routes = [
  {
    path: '',
    component: ConfessionsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfessionsPageRoutingModule {}
