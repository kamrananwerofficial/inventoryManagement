
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionService } from '../../../services/transaction.service';
import { NotificationService } from '../../../services/notification.service';
import { ReportService } from '../../../services/report.service';
import { Purchase } from '../../../models/transaction.model';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
@Component({
  selector: 'app-purchase-detail',
  templateUrl: './purchase-detail.component.html',
  styleUrls: ['./purchase-detail.component.css']
})
export class PurchaseDetailComponent implements OnInit {
  purchase: Purchase | null = null;
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
      const purchaseId = params.get('id');
      
      if (purchaseId) {
        this.isLoading = true; // Set loading state
        this.transactionService.getPurchaseById(purchaseId).subscribe((purchase) => {
          this.purchase = purchase || null;
          this.isLoading = false; // Reset loading state
          if (!this.purchase) {
          this.notificationService.error('Purchase not found');
          this.router.navigate(['/purchases']);
        }
      })
  }
})
  }

  getTotalItems(): number {
    if (!this.purchase) return 0;
    return this.purchase.items.reduce((sum: any, item: { quantity: any; }) => sum + item.quantity, 0);
  }

  exportToPdf(): void {
    if (!this.purchase) return;
    
    // Create a PDF purchase order
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Purchase Order', 14, 22);
    
    // Add purchase details
    doc.setFontSize(12);
    doc.text(`Reference: ${this.purchase.reference}`, 14, 35);
    doc.text(`Date: ${new Date(this.purchase.date).toLocaleDateString()}`, 14, 42);
    doc.text(`Supplier: ${this.purchase.supplierName}`, 14, 49);
    
    // Add items table
    const tableColumn = ["Item", "Quantity", "Cost Price", "Total"];
    const tableRows: any[] = [];
    
    this.purchase.items.forEach((item: { itemName: any; quantity: any; costPrice: number; totalPrice: number; }) => {
      const itemData = [
        item.itemName,
        item.quantity,
        `$${item.costPrice.toFixed(2)}`,
        `$${item.totalPrice.toFixed(2)}`
      ];
      tableRows.push(itemData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    // Add total
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Items: ${this.getTotalItems()}`, 14, finalY);
    doc.text(`Total Amount: $${this.purchase.totalAmount.toFixed(2)}`, 14, finalY + 7);
    
    // Add notes if any
    if (this.purchase.notes) {
      doc.text('Notes:', 14, finalY + 20);
      doc.setFontSize(10);
      doc.text(this.purchase.notes, 14, finalY + 27);
    }
    
    // Save the PDF
    doc.save(`PurchaseOrder-${this.purchase.reference}.pdf`);
    this.notificationService.success('Purchase order exported to PDF');
  }
}
