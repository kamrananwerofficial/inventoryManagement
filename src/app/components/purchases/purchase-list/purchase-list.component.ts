
import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../../../services/transaction.service';
import { Purchase } from '../../../models/transaction.model';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-purchase-list',
  templateUrl: './purchase-list.component.html',
  styleUrls: ['./purchase-list.component.css']
})
export class PurchaseListComponent implements OnInit {
  purchases: Purchase[] = [];
  filteredPurchases: Purchase[] = [];
  filterForm: FormGroup;
  
  sortField = 'date';
  sortDirection = 'desc';
  
  constructor(
    private transactionService: TransactionService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.loadPurchases();
  }

  createFilterForm(): FormGroup {
    return this.fb.group({
      startDate: [''],
      endDate: [''],
      supplierName: [''],
      minAmount: [''],
      maxAmount: ['']
    });
  }
  getTotalAmount(filteredPurchases:any):any {
    return filteredPurchases.reduce((sum:any, purchase:any) => sum + purchase.totalAmount, 0)
  }
  loadPurchases(): void {
    this.transactionService.getPurchases().subscribe(purchases => {
      this.purchases = purchases;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.purchases];
    
    // Apply date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(purchase => new Date(purchase.date) >= startDate);
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(purchase => new Date(purchase.date) <= endDate);
    }
    
    // Apply supplier name filter
    if (filters.supplierName) {
      const supplierName = filters.supplierName.toLowerCase();
      filtered = filtered.filter(purchase => 
        purchase.supplierName.toLowerCase().includes(supplierName)
      );
    }
    
    // Apply amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter(purchase => purchase.totalAmount >= filters.minAmount);
    }
    
    if (filters.maxAmount) {
      filtered = filtered.filter(purchase => purchase.totalAmount <= filters.maxAmount);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let fieldA: any = a[this.sortField as keyof Purchase];
      let fieldB: any = b[this.sortField as keyof Purchase];
      
      // Handle date comparison
      if (this.sortField === 'date') {
        fieldA = new Date(fieldA).getTime();
        fieldB = new Date(fieldB).getTime();
      }
      
      // Handle string comparison
      if (typeof fieldA === 'string') {
        fieldA = fieldA.toLowerCase();
        fieldB = fieldB.toLowerCase();
      }
      
      if (fieldA < fieldB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (fieldA > fieldB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    this.filteredPurchases = filtered;
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      // Toggle sort direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    
    this.applyFilters();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  getTotalItems(purchase: Purchase): number {
    return purchase.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
