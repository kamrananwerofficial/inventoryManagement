import { Component, OnInit } from '@angular/core';
import { ItemService } from '../../services/item.service';
import { TransactionService } from '../../services/transaction.service';
import { Item } from '../../models/item.model';
import { Sale, Purchase } from '../../models/transaction.model';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AuthService } from 'src/app/services/authService';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  items: Item[] = [];
  recentSales: Sale[] = [];
  recentPurchases: Purchase[] = [];

  totalItems = 0;
  totalValue = 0;
  totalSales = 0;
  totalPurchases = 0;

  // Chart configs
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {},
      y: { min: 0 }
    },
    plugins: {
      legend: { display: true }
    }
  };

  public barChartType: ChartType = 'bar';
  public barChartPlugins = [];

  public salesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Sales' }],
  };

  public categoryChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [] }]
  };

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' }
    }
  };

  public pieChartType: ChartType = 'pie';
  lowStockItems: any[] = [];
  isShowBarChart: boolean = false;

  constructor(
    private itemService: ItemService,
    private transactionService: TransactionService,
    private auth: AuthService
  ) {}

  getTotal(sale: Sale): number {
    return sale.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  currencySymbol: string = '$';
  getCurrencySymbol(): string {
    const currency = this.auth.getCurrency();
    return currency === 'PKR' ? '₨' : currency === 'EUR' ? '€' : '$';
  }

  getLowStockItems(): void {
    this.itemService.getItems().subscribe((items: Item[]) => {
      this.lowStockItems = items.filter(item => item.quantity <= item.reorderLevel);
    });
  }

  isShowPieChart: boolean = false;
  ngOnInit(): void {
    this.itemService.getItems().subscribe(items => {
      this.items = items;
      this.totalItems = items.length;
      this.totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      // ✅ Category-wise count for Pie Chart
      const categoryCounts: { [key: string]: number } = {};
      for (const item of items) {
        const category = item.category || 'Uncategorized';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
      this.categoryChartData.labels = Object.keys(categoryCounts);
      this.categoryChartData.datasets[0].data = Object.values(categoryCounts);
      this.isShowPieChart = true
    });
    this.getLowStockItems()
this.transactionService.getSales().subscribe((sales: Sale[]) => {
  this.recentSales = sales
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  this.totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
});

this.transactionService.getPurchases().subscribe((purchases: Purchase[]) => {
  this.recentPurchases = purchases
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  this.totalPurchases = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
});


    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
this.transactionService.getSales().subscribe((sales: Sale[]) => {
  const salesLast7Days = sales.filter(sale => new Date(sale.date) >= sevenDaysAgo);
  const groupedSales: { [date: string]: number } = {};
  salesLast7Days.forEach(sale => {
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
  this.isShowBarChart = true;
});
  }
}