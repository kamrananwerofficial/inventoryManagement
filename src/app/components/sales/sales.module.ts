
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SaleListComponent } from './sale-list/sale-list.component';
import { SaleFormComponent } from './sale-form/sale-form.component';
import { SaleDetailComponent } from './sale-detail/sale-detail.component';
import { FormsModule } from '@angular/forms';

const routes: Routes = [
  { path: '', component: SaleListComponent },
  { path: 'new', component: SaleFormComponent },
  { path: 'detail/:id', component: SaleDetailComponent }
];

@NgModule({
  declarations: [
    SaleListComponent,
    SaleFormComponent,
    SaleDetailComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    FormsModule
  ]
})
export class SalesModule { }
