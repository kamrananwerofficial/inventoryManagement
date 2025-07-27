
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { LedgerComponent } from './ledger.component';


const routes: Routes = [
  { path: '', component: LedgerComponent }
];

@NgModule({
  declarations: [
    LedgerComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class LedgerModule { }
