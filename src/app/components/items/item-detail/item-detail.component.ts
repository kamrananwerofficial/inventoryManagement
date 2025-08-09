import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemService } from '../../../services/item.service';
import { TransactionService } from '../../../services/transaction.service';
import { NotificationService } from '../../../services/notification.service';
import { Item } from '../../../models/item.model';
import { Transaction, TransactionType } from '../../../models/transaction.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.css']
})
export class ItemDetailComponent implements OnInit {
  item: Item | null = null;
  itemTransactions: any[] = [];
  adjustmentForm: FormGroup;
  itemId: string | null = null;
  isLoading: boolean = false; // loading state

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private modalService: NgbModal
  ) {
    this.adjustmentForm = this.createAdjustmentForm();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.itemId = params.get('id');
      if (!this.itemId) {
        this.notificationService.error('Invalid item ID');
        this.router.navigate(['/items']);
        return;
      }

      // Subscribe to item changes
      this.isLoading = true; // Set loading state
     this.itemService.getItemById(this.itemId).subscribe({
  next: (item) => {
    this.item = item;
    this.loadItemTransactions();
  },
  error: () => {
    this.notificationService.error('Item not found');
    this.router.navigate(['/items']);
  },
  complete: () => {
    this.isLoading = false; // Reset loading state
  }
});
    });
  }

loadItemTransactions(): void {
  if (!this.itemId) return;

  // Step 1: Get sales and purchases parallelly
  forkJoin([
    this.transactionService.getTransactionsByDateRange(new Date(0), new Date(),TransactionType.SALE),
    this.transactionService.getTransactionsByDateRange(new Date(0), new Date(),TransactionType.PURCHASE)
  ]).subscribe(([sales, purchases]) => {
    const salesTransactions = sales
      .filter(s => s.itemId == this.itemId)
      .map(sale => ({
        itemId: sale.itemId,
        quantity: sale.quantity,
        date: new Date(sale.date),
         unitPrice: sale.unitPrice,
          totalAmount: sale.totalAmount,
          reference: sale.reference,
        type: 'Sale'
      }));

    const purchaseTransactions = purchases
      .filter(p => p.itemId == this.itemId)
      .map(purchase => {
        return {
          itemId: purchase.itemId,
          quantity: purchase.quantity,
          date: new Date(purchase.date),
          unitPrice: purchase.unitPrice,
          totalAmount: purchase.totalAmount,
          reference: purchase.reference,
          type: 'Purchase'
        };
      });

    // Step 3: Merge and sort
    this.itemTransactions = [...salesTransactions, ...purchaseTransactions]
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  });
}


  createAdjustmentForm(): FormGroup {
    return this.fb.group({
      quantity: [0, [Validators.required]],
      notes: ['', Validators.required]
    });
  }

  openAdjustmentModal(modal: any): void {
    this.adjustmentForm.reset({
      quantity: 0,
      notes: ''
    });
    this.modalService.open(modal, { centered: true });
  }

 submitAdjustment(): void {
  if (this.adjustmentForm.invalid || !this.item) return;

  const formValues = this.adjustmentForm.value;

  const adjustment = {
    itemId: this.item.id,
    quantity: formValues.quantity,
    notes: formValues.notes,
    date: new Date()
  };

  this.transactionService.createAdjustment(adjustment).subscribe({
    next: () => {
      this.notificationService.success('Inventory adjustment completed successfully');
      this.modalService.dismissAll();
      this.loadItemTransactions(); // Refresh data
    },
    error: (err) => {
      this.notificationService.error(err?.error || 'Adjustment failed');
    }
  });
}

  getStockStatus(): { status: string; class: string } {
    if (!this.item) return { status: 'Unknown', class: 'bg-secondary' };
    if (this.item.quantity <= 0) {
      return { status: 'Out of Stock', class: 'bg-danger' };
    } else if (this.item.quantity <= this.item.reorderLevel) {
      return { status: 'Low Stock', class: 'bg-warning text-dark' };
    } else {
      return { status: 'In Stock', class: 'bg-success' };
    }
  }

  getTransactionTypeClass(type: string): string {
    switch (type) {
      case 'Sale':
        return 'text-danger';
      case 'Purchase':
        return 'text-success';
      case 'Adjustment':
        return 'text-warning';
      default:
        return '';
    }
  }

  getTransactionQuantityPrefix(type: string): string {
    switch (type) {
      case 'Sale':
        return '-';
      case 'Purchase':
        return '+';
      case 'Adjustment':
        return '';
      default:
        return '';
    }
  }
}
