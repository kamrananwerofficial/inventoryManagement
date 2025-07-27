
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './services/auth.Guard';
import { LoginComponent } from './components/login/login.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full'},
   { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    loadChildren: () => import('./components/dashboard/dashboard.module').then(m => m.DashboardModule) ,canActivate: [AuthGuard] 
  },
  { 
    path: 'items', 
    loadChildren: () => import('./components/items/items.module').then(m => m.ItemsModule) ,canActivate: [AuthGuard]
  },
  { 
    path: 'sales', 
    loadChildren: () => import('./components/sales/sales.module').then(m => m.SalesModule) ,canActivate: [AuthGuard]
  },
  { 
    path: 'purchases', 
    loadChildren: () => import('./components/purchases/purchases.module').then(m => m.PurchasesModule)  ,canActivate: [AuthGuard]
  },
  { 
    path: 'ledger', 
    loadChildren: () => import('./components/ledger/ledger.module').then(m => m.LedgerModule) ,canActivate: [AuthGuard]
  },
  { 
    path: 'reports', 
    loadChildren: () => import('./components/reports/reports.module').then(m => m.ReportsModule) ,canActivate: [AuthGuard]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
