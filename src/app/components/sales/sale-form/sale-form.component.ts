
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemService } from '../../../services/item.service';
import { TransactionService } from '../../../services/transaction.service';
import { NotificationService } from '../../../services/notification.service';
import { Item } from '../../../models/item.model';
import { SaleItem } from '../../../models/transaction.model';

@Component({
  selector: 'app-sale-form',
  templateUrl: './sale-form.component.html',
  styleUrls: ['./sale-form.component.css']
})
export class SaleFormComponent implements OnInit {
  saleForm: FormGroup;
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
    this.saleForm = this.createSaleForm();
  }

  ngOnInit(): void {
    this.loadItems();
  }

  createSaleForm(): FormGroup {
    return this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      customerName: ['', Validators.required],
      paymentMethod: ['Cash', Validators.required],
      reference: [`INV-${Date.now().toString().substring(6)}`, Validators.required],
      notes: [''],
      items: this.fb.array([])
    });
  }

  get saleItems(): FormArray {
    return this.saleForm.get('items') as FormArray;
  }
  
  getSaleItemFormGroup(index: number): FormGroup {
    return this.saleItems.at(index) as FormGroup;
  }

  addSaleItem(item?: Item): void {
    const saleItem = this.fb.group({
      itemId: [item ? item.id : '', Validators.required],
      itemName: [item ? item.name : '', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [item ? item.unitPrice : 0, [Validators.required, Validators.min(0.01)]],
      totalPrice: [item ? item.unitPrice : 0]
    });
    
    // Update total price when quantity or unit price changes
    saleItem.get('quantity')?.valueChanges.subscribe(() => this.updateItemTotal(saleItem));
    saleItem.get('unitPrice')?.valueChanges.subscribe(() => this.updateItemTotal(saleItem));
    
    this.saleItems.push(saleItem);
    this.updateTotals();
  }

  removeSaleItem(index: number): void {
    this.saleItems.removeAt(index);
    this.updateTotals();
  }

  updateItemTotal(saleItem: FormGroup): void {
    const quantity = saleItem.get('quantity')?.value || 0;
    const unitPrice = saleItem.get('unitPrice')?.value || 0;
    const totalPrice = quantity * unitPrice;
    
    saleItem.patchValue({ totalPrice });
    this.updateTotals();
  }

  updateTotals(): void {
    // This method is called whenever items change to update the total
    // The total is calculated in the template
  }

  loadItems(): void {
    this.itemService.getItems().subscribe(items => {
      this.items = items.filter(item => item.quantity > 0); // Only show items in stock
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
    this.addSaleItem(item);
    this.searchTerm = '';
    this.filteredItems = [...this.items];
  }

  getItemById(id: string): Item | undefined {
    return this.items.find(item => item.id === id);
  }

  checkInventory(index: number): boolean {
    const saleItem = this.saleItems.at(index) as FormGroup;
    const itemId = saleItem.get('itemId')?.value;
    const requestedQuantity = saleItem.get('quantity')?.value || 0;
    
    const item = this.getItemById(itemId);
    if (!item) return false;
    
    // Check if requested quantity exceeds available stock
    if (requestedQuantity > item.quantity) {
      saleItem.get('quantity')?.setErrors({ 'insufficientStock': true });
      return false;
    }
    
    saleItem.get('quantity')?.setErrors(null);
    return true;
  }

  onSubmit(): void {
    if (this.saleForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.saleForm.controls).forEach(key => {
        const control = this.saleForm.get(key);
        control?.markAsTouched();
      });
      
      // Mark all item fields as touched
      this.saleItems.controls.forEach(control => {
        Object.keys(control.value).forEach(key => {
          const field = control.get(key);
          field?.markAsTouched();
        });
      });
      
      this.notificationService.warning('Please fix the form errors before submitting');
      return;
    }
    
    // Check inventory for all items
    let inventoryValid = true;
    for (let i = 0; i < this.saleItems.length; i++) {
      if (!this.checkInventory(i)) {
        inventoryValid = false;
      }
    }
    
    if (!inventoryValid) {
      this.notificationService.error('Some items have insufficient stock');
      return;
    }
    
    // Calculate total amount
    const totalAmount = this.saleItems.controls.reduce((sum, control) => {
      return sum + (control.get('totalPrice')?.value || 0);
    }, 0);
    
    // Create sale object
    const saleData = {
      ...this.saleForm.value,
      totalAmount,
      date: new Date(this.saleForm.value.date)
    };
    
    // Submit sale
    const success = this.transactionService.createSale(saleData);
    
    if (success) {
      this.notificationService.success('Sale created successfully');
      this.router.navigate(['/sales']);
    } else {
      this.notificationService.error('Failed to create sale. Please check inventory levels.');
    }
  }

  getTotalAmount(): number {
    return this.saleItems.controls.reduce((sum, control) => {
      return sum + (control.get('totalPrice')?.value || 0);
    }, 0);
  }
}
