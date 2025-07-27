
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Item } from 'src/app/models/item.model';
import { Purchase, Sale, Transaction } from 'src/app/models/transaction.model';
import { ItemService } from 'src/app/services/item.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ReportService } from 'src/app/services/report.service';
import { TransactionService } from 'src/app/services/transaction.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  items: Item[] = [];
  lowStockItems: Item[] = [];
  sales: Sale[] = [];
  purchases: Purchase[] = [];
  transactions: Transaction[] = [];
  
  filterForm: FormGroup;
  
  // Chart configurations
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {},
      y: {
        min: 0
      }
    },
    plugins: {
      legend: {
        display: true,
      }
    }
  };
  
  public barChartType: ChartType = 'bar';
  public pieChartType: ChartType = 'pie';
  
  public salesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Sales' }
    ]
  };
  
  public categoryChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      { data: [] }
    ]
  };
  
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      }
    }
  };
  
  constructor(
    private itemService: ItemService,
    private transactionService: TransactionService,
    private reportService: ReportService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.loadData();
  }

  createFilterForm(): FormGroup {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return this.fb.group({
      startDate: [thirtyDaysAgo.toISOString().split('T')[0]],
      endDate: [today.toISOString().split('T')[0]]
    });
  }

  loadData(): void {
    // Load items
    this.itemService.getItems().subscribe(items => {
      this.items = items;
      this.lowStockItems = items.filter(item => item.quantity <= item.reorderLevel);
      
      // Prepare category chart data
      const categories = this.itemService.getItemsByCategory();
      this.categoryChartData.labels = Object.keys(categories);
      this.categoryChartData.datasets[0].data = Object.values(categories);
    });
    
    // Load transactions based on date range
    this.applyDateFilter();
  }

  applyDateFilter(): void {
    const filters = this.filterForm.value;
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999); // End of day
    
    // Load sales
    this.sales = this.transactionService.getSalesByDateRange(startDate, endDate);
    
    // Load purchases
    this.purchases = this.transactionService.getPurchasesByDateRange(startDate, endDate);
    
    // Load transactions
    this.transactions = this.transactionService.getTransactionsByDateRange(startDate, endDate);
    
    // Prepare sales chart data
    const dailySales = this.transactionService.getDailySalesData(startDate, endDate);
    this.salesChartData.labels = dailySales.map(day => day.date);
    this.salesChartData.datasets[0].data = dailySales.map(day => day.totalSales);
  }

  generateInventoryReport(): void {
    const doc = this.reportService.generateInventoryReport(this.items);
    doc.save('Inventory-Report.pdf');
    this.notificationService.success('Inventory report generated successfully');
  }

  generateSalesReport(): void {
    const filters = this.filterForm.value;
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999); // End of day
    
    const doc = this.reportService.generateSalesReport(this.sales, startDate, endDate);
    doc.save('Sales-Report.pdf');
    this.notificationService.success('Sales report generated successfully');
  }

  generatePurchaseReport(): void {
    const filters = this.filterForm.value;
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999); // End of day
    
    const doc = this.reportService.generatePurchaseReport(this.purchases, startDate, endDate);
    doc.save('Purchase-Report.pdf');
    this.notificationService.success('Purchase report generated successfully');
  }

  generateLowStockReport(): void {
    const doc = this.reportService.generateLowStockReport(this.lowStockItems);
    doc.save('Low-Stock-Report.pdf');
    this.notificationService.success('Low stock report generated successfully');
  }

  getTotalSales(): number {
    return this.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  }

  getTotalPurchases(): number {
    return this.purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
  }

  getTotalInventoryValue(): number {
    return this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  getTotalInventoryItems(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
