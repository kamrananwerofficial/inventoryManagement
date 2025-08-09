
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionService } from '../../../services/transaction.service';
import { NotificationService } from '../../../services/notification.service';
import { ReportService } from '../../../services/report.service';
import { Sale } from '../../../models/transaction.model';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-sale-detail',
  templateUrl: './sale-detail.component.html',
  styleUrls: ['./sale-detail.component.css']
})
export class SaleDetailComponent implements OnInit {
  sale: Sale | null = null;
  isLoading: boolean = false; // loading state
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const saleId = params.get('id');
      if (saleId) {
        this.isLoading = true; // Set loading state
        this.transactionService.getSaleById(saleId).subscribe((sale) => {
          this.sale = sale || null;
          this.isLoading = false; // Reset loading state
          if (!this.sale) {
          this.notificationService.error('Sale not found');
          this.router.navigate(['/sales']);
        }
      })
  }
    });
  }

  getTotalItems(): number {
    if (!this.sale) return 0;
    return this.sale.items.reduce((sum:any, item:any) => sum + item.quantity, 0);
  }

  exportToPdf(): void {
    if (!this.sale) return;
    
    // Create a PDF invoice
     const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Sales Invoice', 14, 22);
    
    // Add invoice details
    doc.setFontSize(12);
    doc.text(`Invoice: ${this.sale.reference}`, 14, 35);
    doc.text(`Date: ${new Date(this.sale.date).toLocaleDateString()}`, 14, 42);
    doc.text(`Customer: ${this.sale.customerName}`, 14, 49);
    doc.text(`Payment Method: ${this.sale.paymentMethod}`, 14, 56);
    
    // Add items table
    const tableColumn = ["Item", "Quantity", "Unit Price", "Total"];
    const tableRows: any[] = [];
    
    this.sale.items.forEach((item:any) => {
      const itemData = [
        item.itemName,
        item.quantity,
        `$${item.unitPrice.toFixed(2)}`,
        `$${item.totalPrice.toFixed(2)}`
      ];
      tableRows.push(itemData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    // Add total
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Items: ${this.getTotalItems()}`, 14, finalY);
    doc.text(`Total Amount: $${this.sale.totalAmount.toFixed(2)}`, 14, finalY + 7);
    
    // Add notes if any
    if (this.sale.notes) {
      doc.text('Notes:', 14, finalY + 20);
      doc.setFontSize(10);
      doc.text(this.sale.notes, 14, finalY + 27);
    }
    
    // Save the PDF
    doc.save(`Invoice-${this.sale.reference}.pdf`);
    this.notificationService.success('Invoice exported to PDF');
  }
}
