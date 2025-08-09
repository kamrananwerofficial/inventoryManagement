
import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Item } from '../models/item.model';
import { Transaction, Sale, Purchase, TransactionType } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor() {}

  // Generate inventory report
  generateInventoryReport(items: Item[]): jsPDF {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Inventory Report', 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Create table
    autoTable(doc, {
      head: [['SKU', 'Name', 'Category', 'Quantity', 'Unit Price', 'Cost Price', 'Value']],
      body: items.map(item => [
        item.sku,
        item.name,
        item.category,
        item.quantity.toString(),
        `$${item.unitPrice.toFixed(2)}`,
        `$${item.costPrice.toFixed(2)}`,
        `$${(item.quantity * item.unitPrice).toFixed(2)}`
      ]),
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    // Add summary
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Items: ${totalItems}`, 14, finalY);
    doc.text(`Total Inventory Value: $${totalValue.toFixed(2)}`, 14, finalY + 7);
    
    return doc;
  }

  // Generate sales report
  generateSalesReport(sales: Sale[], startDate: Date, endDate: Date): jsPDF {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Sales Report', 14, 22);
    
    // Add date range
    doc.setFontSize(11);
    doc.text(`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);
    
    // Create table
    autoTable(doc, {
      head: [['Date', 'Reference', 'Customer', 'Items', 'Total Amount']],
      body: sales.map(sale => [
        new Date(sale.date).toLocaleDateString(),
        sale.reference,
        sale.customerName,
        sale.quantity.toString(),
        `$${sale.totalAmount.toFixed(2)}`
      ]),
      startY: 46,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    // Add summary
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalItems = sales.reduce((sum, sale) => 
      sum + (sale.quantity || 0), 0)
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Sales: ${totalSales}`, 14, finalY);
    doc.text(`Total Items Sold: ${totalItems}`, 14, finalY + 7);
    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 14, finalY + 14);
    
    return doc;
  }

  // Generate purchase report
  generatePurchaseReport(purchases: Purchase[], startDate: Date, endDate: Date): jsPDF {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Purchase Report', 14, 22);
    
    // Add date range
    doc.setFontSize(11);
    doc.text(`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);
    
    // Create table
    autoTable(doc, {
      head: [['Date', 'Reference', 'Supplier', 'Items', 'Total Amount']],
      body: purchases.map(purchase => [
        new Date(purchase.date).toLocaleDateString(),
        purchase.reference,
        purchase.supplierName,
        purchase.items.reduce((sum, item) => sum + item.quantity, 0).toString(),
      `$${purchase.totalAmount.toFixed(2)}`
      ]),
      startY: 46,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    // Add summary
    const totalPurchases = purchases.length;
    const totalCost = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    const totalItems =  purchases.reduce((sum, purchase) => 
      sum + purchase.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Purchases: ${totalPurchases}`, 14, finalY);
    doc.text(`Total Items Purchased: ${totalItems}`, 14, finalY + 7);
    doc.text(`Total Cost: $${totalCost.toFixed(2)}`, 14, finalY + 14);
    
    return doc;
  }

  // Generate transaction ledger report
  generateLedgerReport(transactions: Transaction[], startDate: Date, endDate: Date): jsPDF {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Transaction Ledger', 14, 22);
    
    // Add date range
    doc.setFontSize(11);
    doc.text(`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);
    
    // Create table
    autoTable(doc, {
      head: [['Date', 'Type', 'Item', 'Quantity', 'Unit Price', 'Total', 'Reference']],
      body: transactions.map(transaction => [
        new Date(transaction.date).toLocaleDateString(),
        transaction.type,
        transaction.itemName,
        transaction.quantity.toString(),
        `$${transaction.unitPrice.toFixed(2)}`,
        `$${transaction.totalAmount.toFixed(2)}`,
        transaction.reference
      ]),
      startY: 46,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    // Add summary
    const sales = transactions.filter(t => t.type === TransactionType.SALE);
    const purchases = transactions.filter(t => t.type === TransactionType.PURCHASE);
    const adjustments = transactions.filter(t => t.type === TransactionType.ADJUSTMENT);

    const totalSales = sales.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalPurchases = purchases.reduce((sum, t) => sum + t.totalAmount, 0);
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Transactions: ${transactions.length}`, 14, finalY);
    doc.text(`Sales: ${sales.length} ($${totalSales.toFixed(2)})`, 14, finalY + 7);
    doc.text(`Purchases: ${purchases.length} ($${totalPurchases.toFixed(2)})`, 14, finalY + 14);
    doc.text(`Adjustments: ${adjustments.length}`, 14, finalY + 21);
    doc.text(`Net: $${(totalSales - totalPurchases).toFixed(2)}`, 14, finalY + 28);
    
    return doc;
  }

  // Generate low stock report
  generateLowStockReport(items: Item[]): jsPDF {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Low Stock Report', 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Create table
    autoTable(doc, {
      head: [['SKU', 'Name', 'Current Quantity', 'Reorder Level', 'Status']],
      body: items.map(item => [
        item.sku,
        item.name,
        item.quantity.toString(),
        item.reorderLevel.toString(),
        item.quantity <= 0 ? 'OUT OF STOCK' : 'LOW STOCK'
      ]),
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [217, 83, 79] }
    });
    
    // Add summary
    const outOfStock = items.filter(item => item.quantity <= 0).length;
    const lowStock = items.filter(item => item.quantity > 0 && item.quantity <= item.reorderLevel).length;
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Low Stock Items: ${items.length}`, 14, finalY);
    doc.text(`Out of Stock: ${outOfStock}`, 14, finalY + 7);
    doc.text(`Low Stock: ${lowStock}`, 14, finalY + 14);
    
    return doc;
  }
}
