
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemService } from '../../../services/item.service';
import { TransactionService } from '../../../services/transaction.service';
import { NotificationService } from '../../../services/notification.service';
import { Item } from '../../../models/item.model';
import { PurchaseItem } from '../../../models/transaction.model';

@Component({
  selector: 'app-purchase-form',
  templateUrl: './purchase-form.component.html',
  styleUrls: ['./purchase-form.component.css']
})
export class PurchaseFormComponent implements OnInit {
  purchaseForm: FormGroup;
  items: Item[] = [];
  filteredItems: Item[] = [];
  searchTerm = '';
  
  constructor(
    private fb: FormBuilder,
    private itemService: ItemService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.purchaseForm = this.createPurchaseForm();
  }

  ngOnInit(): void {
    this.loadItems();
  }

  createPurchaseForm(): FormGroup {
    return this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      supplierName: ['', Validators.required],
      reference: [`PO-${Date.now().toString().substring(6)}`, Validators.required],
      notes: [''],
      items: this.fb.array([])
    });
  }

  get purchaseItems(): FormArray {
    return this.purchaseForm.get('items') as FormArray;
  }
  
  getPurchaseItemFormGroup(index: number): FormGroup {
    return this.purchaseItems.at(index) as FormGroup;
  }

  addPurchaseItem(item?: Item): void {
    const purchaseItem = this.fb.group({
      itemId: [item ? item.id : '', Validators.required],
      itemName: [item ? item.name : '', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      costPrice: [item ? item.costPrice : 0, [Validators.required, Validators.min(0.01)]],
      totalPrice: [item ? item.costPrice : 0]
    });
    
    // Update total price when quantity or cost price changes
    purchaseItem.get('quantity')?.valueChanges.subscribe(() => this.updateItemTotal(purchaseItem));
    purchaseItem.get('costPrice')?.valueChanges.subscribe(() => this.updateItemTotal(purchaseItem));
    
    this.purchaseItems.push(purchaseItem);
    this.updateTotals();
  }

  removePurchaseItem(index: number): void {
    this.purchaseItems.removeAt(index);
    this.updateTotals();
  }

  updateItemTotal(purchaseItem: FormGroup): void {
    const quantity = purchaseItem.get('quantity')?.value || 0;
    const costPrice = purchaseItem.get('costPrice')?.value || 0;
    const totalPrice = quantity * costPrice;
    
    purchaseItem.patchValue({ totalPrice });
    this.updateTotals();
  }

  updateTotals(): void {
    // This method is called whenever items change to update the total
    // The total is calculated in the template
  }

  loadItems(): void {
    this.itemService.getItems().subscribe(items => {
      this.items = items;
      this.filteredItems = [...this.items];
    });
  }

  filterItems(): void {
    if (!this.searchTerm.trim()) {
      this.filteredItems = [...this.items];
      return;
    }
    
    const search = this.searchTerm.toLowerCase().trim();
    this.filteredItems = this.items.filter(item => 
      item.name.toLowerCase().includes(search) || 
      item.sku.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search)
    );
  }

  selectItem(item: Item): void {
    this.addPurchaseItem(item);
    this.searchTerm = '';
    this.filteredItems = [...this.items];
  }

  getItemById(id: string): Item | undefined {
    return this.items.find(item => item.id === id);
  }

  onSubmit(): void {
    if (this.purchaseForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.purchaseForm.controls).forEach(key => {
        const control = this.purchaseForm.get(key);
        control?.markAsTouched();
      });
      
      // Mark all item fields as touched
      this.purchaseItems.controls.forEach(control => {
        Object.keys(control.value).forEach(key => {
          const field = control.get(key);
          field?.markAsTouched();
        });
      });
      
      this.notificationService.warning('Please fix the form errors before submitting');
      return;
    }
    
    // Calculate total amount
    const totalAmount = this.purchaseItems.controls.reduce((sum, control) => {
      return sum + (control.get('totalPrice')?.value || 0);
    }, 0);
    
    // Create purchase object
    const purchaseData = {
      ...this.purchaseForm.value,
      totalAmount,
      date: new Date(this.purchaseForm.value.date)
    };
    
    // Submit purchase
    this.transactionService.createPurchase(purchaseData);
    this.notificationService.success('Purchase created successfully');
    this.router.navigate(['/purchases']);
  }

  getTotalAmount(): number {
    return this.purchaseItems.controls.reduce((sum, control) => {
      return sum + (control.get('totalPrice')?.value || 0);
    }, 0);
  }
}
