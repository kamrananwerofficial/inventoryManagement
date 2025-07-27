
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
  lowStockItems: Item[] = [];
  recentSales: Sale[] = [];
  recentPurchases: Purchase[] = [];
  
  totalItems = 0;
  totalValue = 0;
  totalSales = 0;
  totalPurchases = 0;
  
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
  public barChartPlugins = [];
  
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
  
  public pieChartType: ChartType = 'pie';

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
  ngOnInit(): void {
    // Load items
    this.itemService.getItems().subscribe(items => {
      this.items = items;
      this.totalItems = items.length;
      this.totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      this.lowStockItems = items.filter(item => item.quantity <= item.reorderLevel);
      
      // Prepare category chart data
      const categories = this.itemService.getItemsByCategory();
      this.categoryChartData.labels = Object.keys(categories);
      this.categoryChartData.datasets[0].data = Object.values(categories);
    });
    
    // Load recent sales
    this.transactionService.getSales().subscribe(sales => {
      // Sort by date descending
      this.recentSales = sales
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      this.totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    });
    
    // Load recent purchases
    this.transactionService.getPurchases().subscribe(purchases => {
      // Sort by date descending
      this.recentPurchases = purchases
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      this.totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    });
    
    // Prepare sales chart data (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const dailySales = this.transactionService.getDailySalesData(sevenDaysAgo, today);
    this.salesChartData.labels = dailySales.map(day => day.date);
    this.salesChartData.datasets[0].data = dailySales.map(day => day.totalSales);
  }
}
