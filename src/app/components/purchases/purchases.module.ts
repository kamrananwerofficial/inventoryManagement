
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PurchaseListComponent } from './purchase-list/purchase-list.component';
import { PurchaseFormComponent } from './purchase-form/purchase-form.component';
import { PurchaseDetailComponent } from './purchase-detail/purchase-detail.component';


const routes: Routes = [
  { path: '', component: PurchaseListComponent },
  { path: 'new', component: PurchaseFormComponent },
  { path: 'detail/:id', component: PurchaseDetailComponent }
];

@NgModule({
  declarations: [
  
    PurchaseListComponent,
       PurchaseFormComponent,
       PurchaseDetailComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class PurchasesModule { }
