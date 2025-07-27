
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemService } from '../../../services/item.service';
import { TransactionService } from '../../../services/transaction.service';
import { NotificationService } from '../../../services/notification.service';
import { Item } from '../../../models/item.model';
import { Transaction } from '../../../models/transaction.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.css']
})
export class ItemDetailComponent implements OnInit {
  item: Item | null = null;
  itemTransactions: Transaction[] = [];
  adjustmentForm: FormGroup;
  
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
      const itemId = params.get('id');
      
      if (itemId) {
        this.item = this.itemService.getItemById(itemId) || null;
        
        if (this.item) {
          // Load transactions for this item
          this.transactionService.getTransactions().subscribe(transactions => {
            this.itemTransactions = transactions
              .filter(t => t.itemId === itemId)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          });
        } else {
          this.notificationService.error('Item not found');
          this.router.navigate(['/items']);
        }
      }
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
    if (this.adjustmentForm.invalid || !this.item) {
      return;
    }
    
    const formValues = this.adjustmentForm.value;
    
    // Create adjustment transaction
    const success = this.transactionService.createAdjustment({
      date: new Date(),
      itemId: this.item.id,
      itemName: this.item.name,
      quantity: formValues.quantity,
      unitPrice: this.item.unitPrice,
      totalAmount: formValues.quantity * this.item.unitPrice,
      reference: 'Manual Adjustment',
      notes: formValues.notes
    });
    
    if (success) {
      this.notificationService.success('Inventory adjustment completed successfully');
      this.modalService.dismissAll();
      
      // Refresh item data
      if (this.item) {
        this.item = this.itemService.getItemById(this.item.id) || null;
      }
      
      // Refresh transactions
      this.transactionService.getTransactions().subscribe(transactions => {
        if (this.item) {
          this.itemTransactions = transactions
            .filter(t => t.itemId === this.item?.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
      });
    } else {
      this.notificationService.error('Adjustment would result in negative inventory');
    }
  }

  getStockStatus(): { status: string; class: string } {
    if (!this.item) {
      return { status: 'Unknown', class: 'bg-secondary' };
    }
    
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
      case 'SALE':
        return 'text-danger';
      case 'PURCHASE':
        return 'text-success';
      case 'ADJUSTMENT':
        return 'text-warning';
      default:
        return '';
    }
  }

  getTransactionQuantityPrefix(type: string): string {
    switch (type) {
      case 'SALE':
        return '-';
      case 'PURCHASE':
        return '+';
      case 'ADJUSTMENT':
        return '';
      default:
        return '';
    }
  }
}
