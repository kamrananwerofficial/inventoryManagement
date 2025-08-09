
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Transaction, TransactionType } from 'src/app/models/transaction.model';
import { NotificationService } from 'src/app/services/notification.service';
import { ReportService } from 'src/app/services/report.service';
import { TransactionService } from 'src/app/services/transaction.service';

@Component({
  selector: 'app-ledger',
  templateUrl: './ledger.component.html',
  styleUrls: ['./ledger.component.css']
})
export class LedgerComponent implements OnInit {
  transactions: any[] = [];
  filteredTransactions: Transaction[] = [];
  filterForm: FormGroup;
  
  sortField = 'date';
  sortDirection = 'desc';
  
  // Summary data
  totalSales = 0;
  totalPurchases = 0;
  totalAdjustments = 0;
  netAmount = 0;
  
  constructor(
    private transactionService: TransactionService,
    private reportService: ReportService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.loadItemTransactions();
  }

  createFilterForm(): FormGroup {
    return this.fb.group({
      startDate: [''],
      endDate: [''],
      transactionType: [''],
      itemName: [''],
      reference: ['']
    });
  }
  getTransactionType(type: TransactionType): string {
    switch (type) {
      case TransactionType.SALE:
        return 'Sale';
      case TransactionType.PURCHASE:
        return 'Purchase';
      case TransactionType.ADJUSTMENT:
        return 'Adjustment';
      default:
        return 'Unknown';
    }
  }
loadItemTransactions(): void {
  // Step 1: Get sales and purchases parallelly
  forkJoin([
    this.transactionService.getTransactionsByDateRange(new Date(0), new Date(), TransactionType.SALE),
    this.transactionService.getTransactionsByDateRange(new Date(0), new Date(), TransactionType.PURCHASE),
    this.transactionService.getTransactionsByDateRange(new Date(0), new Date(), TransactionType.ADJUSTMENT)
  ]).subscribe(([sales, purchases, adjustments]) => {
    this.transactions = [...sales, ...purchases, ...adjustments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.applyFilters();
  }, error => {
    this.notificationService.error('Failed to load transactions');
  });
}

  applyFilters(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.transactions];
    
    // Apply date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(transaction => new Date(transaction.date) >= startDate);
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(transaction => new Date(transaction.date) <= endDate);
    }
    
    // Apply transaction type filter
    if (filters.transactionType) {
      filtered = filtered.filter(transaction => transaction.type === filters.transactionType);
    }
    
    // Apply item name filter
    if (filters.itemName) {
      const itemName = filters.itemName.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.itemName.toLowerCase().includes(itemName)
      );
    }
    
    // Apply reference filter
    if (filters.reference) {
      const reference = filters.reference.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.reference.toLowerCase().includes(reference)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let fieldA: any = a[this.sortField as keyof Transaction];
      let fieldB: any = b[this.sortField as keyof Transaction];
      
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
    
    this.filteredTransactions = filtered;
    this.calculateSummary();
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

  calculateSummary(): void {
    this.totalSales = this.filteredTransactions.filter(t=> t.type == TransactionType.SALE).reduce((sum, t) => sum + t.totalAmount, 0);

    this.totalPurchases = this.filteredTransactions.filter(t=> t.type == TransactionType.PURCHASE).reduce((sum, t) => sum + t.totalAmount, 0);

    this.totalAdjustments = this.filteredTransactions.filter(t=> t.type == TransactionType.ADJUSTMENT)?.length;

    
    // Net amount is sales minus purchases
    this.netAmount = this.totalSales - this.totalPurchases;
  }

  getTransactionTypeClass(type: any): string {
    switch (type) {
      case TransactionType.SALE:
        return 'text-danger';
      case TransactionType.PURCHASE:
        return 'text-success';
      case TransactionType.ADJUSTMENT:
        return 'text-warning';
      default:
        return '';
    }
  }

  getTransactionQuantityPrefix(type: any): string {
    switch (type) {
      case TransactionType.SALE:
        return '-';
      case TransactionType.PURCHASE:
        return '+';
      case TransactionType.ADJUSTMENT:
        return '';
      default:
        return '';
    }
  }

  exportToPdf(): void {
    if (this.filteredTransactions.length === 0) {
      this.notificationService.warning('No transactions to export');
      return;
    }
    
    // Get date range for report title
    const filters = this.filterForm.value;
    const startDate = filters.startDate ? new Date(filters.startDate) : new Date(0); // Beginning of time
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date(); // Today
    
    // Generate PDF report
    const doc = this.reportService.generateLedgerReport(this.filteredTransactions, startDate, endDate);
    
    // Save the PDF
    doc.save('Transaction-Ledger.pdf');
    this.notificationService.success('Ledger exported to PDF');
  }
}
