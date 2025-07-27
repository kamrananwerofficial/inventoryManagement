
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ItemlistComponent } from './itemlist/itemlist.component';
import { ItemFormComponent } from './item-form/item-form.component';
import { ItemDetailComponent } from './item-detail/item-detail.component';
import { LowStockComponent } from './low-stock/low-stock.component';

const routes: Routes = [
  { path: '', component: ItemlistComponent },
  { path: 'new', component: ItemFormComponent },
  { path: 'edit/:id', component: ItemFormComponent },
  { path: 'detail/:id', component: ItemDetailComponent },
  { path: 'low-stock', component: LowStockComponent }
];

@NgModule({
  declarations: [
    ItemlistComponent,
    ItemFormComponent,
    ItemDetailComponent,
    LowStockComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class ItemsModule { }
