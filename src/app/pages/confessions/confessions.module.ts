import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConfessionsPageRoutingModule } from './confessions-routing.module';

import { ConfessionsPage } from './confessions.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConfessionsPageRoutingModule,
    ConfessionsPage
  ]
})
export class ConfessionsPageModule {}
