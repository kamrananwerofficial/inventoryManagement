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
  searchTerm: string = '';

  paymentMethods = { Cash: 'Cash',
  Credit: 'Credit',
  Bank: 'Bank' } as const;
  PaymentMethod = this.paymentMethods;

  constructor(
    private fb: FormBuilder,
    private itemService: ItemService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.saleForm = this.initForm();
  }

  ngOnInit(): void {
    this.loadItems();
  }

  private initForm(): FormGroup {
    return this.fb.group({
      date: [this.getTodayDate(), Validators.required],
      customerName: ['', Validators.required],
      paymentMethod: [this.PaymentMethod.Cash, Validators.required],
      reference: [this.generateInvoiceReference(), Validators.required],
      notes: [''],
      items: this.fb.array([])
    });
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private generateInvoiceReference(): string {
    return `INV-${Date.now().toString().substring(6)}`;
  }

  get saleItems(): FormArray {
    return this.saleForm.get('items') as FormArray;
  }

  getSaleItemFormGroup(index: number): FormGroup {
    return this.saleItems.at(index) as FormGroup;
  }

  addSaleItem(item?: Item): void {
    const group = this.fb.group({
      itemId: [item?.id || '', Validators.required],
      itemName: [item?.name || '', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [item?.unitPrice ?? 0, [Validators.required, Validators.min(0.01)]],
      totalPrice: [item?.unitPrice ?? 0]
    });

    group.get('quantity')?.valueChanges.subscribe(() => this.updateItemTotal(group));
    group.get('unitPrice')?.valueChanges.subscribe(() => this.updateItemTotal(group));

    this.saleItems.push(group);
    this.updateTotals();
  }

  removeSaleItem(index: number): void {
    this.saleItems.removeAt(index);
    this.updateTotals();
  }

  updateItemTotal(group: FormGroup): void {
    const quantity = group.get('quantity')?.value || 0;
    const unitPrice = group.get('unitPrice')?.value || 0;
    group.patchValue({ totalPrice: quantity * unitPrice }, { emitEvent: false });

    this.updateTotals();
  }

  updateTotals(): void {
    // This is calculated dynamically in getTotalAmount()
  }

  loadItems(): void {
    this.itemService.getItems().subscribe(items => {
      this.items = items.filter(item => item.quantity > 0);
      this.filteredItems = [...this.items];
    });
  }

  filterItems(): void {
    const search = this.searchTerm.toLowerCase().trim();
    this.filteredItems = !search
      ? [...this.items]
      : this.items.filter(item =>
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
    const group = this.saleItems.at(index) as FormGroup;
    const itemId = group.get('itemId')?.value;
    const requestedQty = group.get('quantity')?.value;

    const item = this.getItemById(itemId);
    if (!item) return false;

    if (requestedQty > item.quantity) {
      group.get('quantity')?.setErrors({ insufficientStock: true });
      return false;
    }

    group.get('quantity')?.setErrors(null);
    return true;
  }

  validateForm(): boolean {
    if (this.saleForm.invalid) {
      this.saleForm.markAllAsTouched();
      this.saleItems.controls.forEach(control => control.markAllAsTouched());
      this.notificationService.warning('Please fix the form errors before submitting');
      return false;
    }

    let inventoryValid = true;
    for (let i = 0; i < this.saleItems.length; i++) {
      if (!this.checkInventory(i)) inventoryValid = false;
    }

    if (!inventoryValid) {
      this.notificationService.error('Some items have insufficient stock');
      return false;
    }

    return true;
  }

  onSubmit(): void {
    if (!this.validateForm()) return;

    const totalAmount = this.getTotalAmount();

    const saleData = {
      ...this.saleForm.value,
      totalAmount,
      date: new Date(this.saleForm.value.date)
    };

    this.transactionService.createSale(saleData).subscribe({
      next: res => {
        this.notificationService.success(res?.message || 'Sale created successfully');
        this.router.navigate(['/sales']);
      },
      error: err => {
        console.error(err);
        this.notificationService.error('Failed to create sale. Please try again.');
      }
    });
  }

  getTotalAmount(): number {
    return this.saleItems.controls.reduce((sum, control) => {
      return sum + (control.get('totalPrice')?.value || 0);
    }, 0);
  }
}
