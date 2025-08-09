
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NotificationComponent } from './notification/notification.component';
import { HeaderComponent } from './header/header.component';
import { LoaderDirective } from './loader.directive';

@NgModule({
  declarations: [
    NotificationComponent,
    HeaderComponent,
    LoaderDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgbModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgbModule,
    NotificationComponent,
    HeaderComponent,
    LoaderDirective
  ]
})
export class SharedModule { }
