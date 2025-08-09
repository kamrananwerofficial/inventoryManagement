import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Item } from 'src/app/models/item.model';
import { Purchase, Sale, Transaction, TransactionType } from 'src/app/models/transaction.model';
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
  sales: any[] = [];
  purchases: any[] = [];
  transactions: Transaction[] = [];

  filterForm: FormGroup;

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
    datasets: [{ data: [], label: 'Sales' }]
  };

  public categoryChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [] }]
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
  isChartVisible: boolean = false;
  isShowCategoryChart: boolean = false;

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
    this.itemService.getItems().subscribe(items => {
      this.items = items;
      this.lowStockItems = items.filter(item => item.quantity <= item.reorderLevel);

      // ✅ Updated category calculation using local items array
      const categories: { [key: string]: number } = {};
      items.forEach(item => {
        if (categories[item.category]) {
          categories[item.category]++;
        } else {
          categories[item.category] = 1;
        }
      });

      this.categoryChartData.labels = Object.keys(categories);
      this.categoryChartData.datasets[0].data = Object.values(categories);
      this.isShowCategoryChart = true
    });
  const filters = this.filterForm.value;
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);
    
    this.transactionService.getTransactionsByDateRange(startDate, endDate,TransactionType.SALE).subscribe(Sales => {
      this.sales = Sales;
  const groupedSales: { [date: string]: number } = {};
  Sales.forEach(sale => {
    const dateStr = new Date(sale.date).toLocaleDateString(); // "3/8/2025" etc.
    if (!groupedSales[dateStr]) {
      groupedSales[dateStr] = 0;
    }
    groupedSales[dateStr] += sale.totalAmount || 0;
  });
  const labels = Object.keys(groupedSales);
  const data = Object.values(groupedSales);
  this.salesChartData.labels = labels;
  this.salesChartData.datasets[0].data = data;
    this.isChartVisible = true;
});
    this.transactionService.getTransactionsByDateRange(startDate, endDate,TransactionType.PURCHASE).subscribe(purchases => {
      this.purchases = purchases;
    });

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
    endDate.setHours(23, 59, 59, 999);

    const doc = this.reportService.generateSalesReport(this.sales, startDate, endDate);
    doc.save('Sales-Report.pdf');
    this.notificationService.success('Sales report generated successfully');
  }

  generatePurchaseReport(): void {
    const filters = this.filterForm.value;
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);

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