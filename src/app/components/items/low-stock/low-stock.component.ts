
import { Component, OnInit } from '@angular/core';
import { ItemService } from '../../../services/item.service';
import { TransactionService } from '../../../services/transaction.service';
import { NotificationService } from '../../../services/notification.service';
import { Item } from '../../../models/item.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-low-stock',
  templateUrl: './low-stock.component.html',
  styleUrls: ['./low-stock.component.css']
})
export class LowStockComponent implements OnInit {
  lowStockItems: Item[] = [];
  selectedItem: Item | null = null;
  purchaseForm: FormGroup;
  
  constructor(
    private itemService: ItemService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private modalService: NgbModal
  ) {
    this.purchaseForm = this.createPurchaseForm();
  }

  ngOnInit(): void {
    this.loadLowStockItems();
  }

  loadLowStockItems(): void {
    this.itemService.getItems().subscribe(items => {
      this.lowStockItems = items.filter(item => item.quantity <= item.reorderLevel)
        .sort((a, b) => {
          // Sort by out of stock first, then by low stock
          if (a.quantity <= 0 && b.quantity > 0) {
            return -1;
          }
          if (a.quantity > 0 && b.quantity <= 0) {
            return 1;
          }
          // Then sort by how far below reorder level
          const aPercent = a.quantity / a.reorderLevel;
          const bPercent = b.quantity / b.reorderLevel;
          return aPercent - bPercent;
        });
    });
  }

  createPurchaseForm(): FormGroup {
    return this.fb.group({
      quantity: [0, [Validators.required, Validators.min(1)]],
      costPrice: [0, [Validators.required, Validators.min(0.01)]],
      supplierName: ['', Validators.required],
      reference: ['', Validators.required],
      notes: ['']
    });
  }

  openPurchaseModal(modal: any, item: Item): void {
    this.selectedItem = item;
    
    this.purchaseForm.reset({
      quantity: Math.max(item.reorderLevel - item.quantity, 1),
      costPrice: item.costPrice,
      supplierName: '',
      reference: `PO-${Date.now().toString().substring(6)}`,
      notes: `Restock order for ${item.name}`
    });
    
    this.modalService.open(modal, { centered: true });
  }

  submitPurchase(): void {
    if (this.purchaseForm.invalid || !this.selectedItem) {
      return;
    }
    
    const formValues = this.purchaseForm.value;
    
    // Create purchase transaction
    this.transactionService.createPurchase({
      date: new Date(),
      supplierName: formValues.supplierName,
      items: [
        {
          itemId: this.selectedItem.id,
          itemName: this.selectedItem.name,
          quantity: formValues.quantity,
          costPrice: formValues.costPrice,
          totalPrice: formValues.quantity * formValues.costPrice
        }
      ],
      totalAmount: formValues.quantity * formValues.costPrice,
      reference: formValues.reference,
      notes: formValues.notes
    });
    
    this.notificationService.success(`Purchase order created for ${this.selectedItem.name}`);
    this.modalService.dismissAll();
    this.loadLowStockItems();
  }

  getStockStatus(item: Item): { status: string; class: string } {
    if (item.quantity <= 0) {
      return { status: 'Out of Stock', class: 'bg-danger' };
    } else {
      return { status: 'Low Stock', class: 'bg-warning text-dark' };
    }
  }

  getStockPercentage(item: Item): number {
    if (item.reorderLevel === 0) return 0;
    return Math.min(Math.max(Math.round((item.quantity / item.reorderLevel) * 100), 0), 100);
  }
}
