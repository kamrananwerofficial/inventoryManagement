
import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../../../services/transaction.service';
import { Sale } from '../../../models/transaction.model';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-sale-list',
  templateUrl: './sale-list.component.html',
  styleUrls: ['./sale-list.component.css']
})
export class SaleListComponent implements OnInit {
  sales: Sale[] = [];
  filteredSales: Sale[] = [];
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
    this.loadSales();
  }

  createFilterForm(): FormGroup {
    return this.fb.group({
      startDate: [''],
      endDate: [''],
      customerName: [''],
      minAmount: [''],
      maxAmount: ['']
    });
  }

  loadSales(): void {
    this.transactionService.getSales().subscribe(sales => {
      this.sales = sales;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.sales];
    
    // Apply date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(sale => new Date(sale.date) >= startDate);
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(sale => new Date(sale.date) <= endDate);
    }
    
    // Apply customer name filter
    if (filters.customerName) {
      const customerName = filters.customerName.toLowerCase();
      filtered = filtered.filter(sale => 
        sale.customerName.toLowerCase().includes(customerName)
      );
    }
    
    // Apply amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter(sale => sale.totalAmount >= filters.minAmount);
    }
    
    if (filters.maxAmount) {
      filtered = filtered.filter(sale => sale.totalAmount <= filters.maxAmount);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let fieldA: any = a[this.sortField as keyof Sale];
      let fieldB: any = b[this.sortField as keyof Sale];
      
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
    
    this.filteredSales = filtered;
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

  getTotalItems(sale: Sale): number {
    return sale.items.reduce((sum, item) => sum + item.quantity, 0);
  }
  getTotalAmount(filteredSales:any){
    return filteredSales.reduce((sum: any, sale: { totalAmount: any; }) => sum + sale.totalAmount, 0)
  }
}
