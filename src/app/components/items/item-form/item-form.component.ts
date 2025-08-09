import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemService } from '../../../services/item.service';
import { NotificationService } from '../../../services/notification.service';
import { Item } from '../../../models/item.model';

@Component({
  selector: 'app-item-form',
  templateUrl: './item-form.component.html',
  styleUrls: ['./item-form.component.css']
})
export class ItemFormComponent implements OnInit {
  itemForm: FormGroup;
  isEditMode = false;
  itemId: string | null = null;
  categories: string[] = [];

  constructor(
    private fb: FormBuilder,
    private itemService: ItemService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.itemForm = this.createItemForm();
  }

  ngOnInit(): void {
    this.itemService.getItems().subscribe(items => {
      this.categories = Array.from(new Set(items.map(item => item.category)));
    });

    this.route.paramMap.subscribe(params => {
      this.itemId = params.get('id');

      if (this.itemId) {
        this.isEditMode = true;
        this.itemService.getItemById(this.itemId).subscribe(item => {
          if (item) {
            this.itemForm.patchValue(item);
          } else {
            this.notificationService.error('Item not found');
            this.router.navigate(['/items']);
          }
        });
      }
    });
  }

  createItemForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      category: ['', Validators.required],
      sku: ['', Validators.required],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [5, [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.itemForm.invalid) {
      Object.keys(this.itemForm.controls).forEach(key => {
        const control = this.itemForm.get(key);
        control?.markAsTouched();
      });

      this.notificationService.warning('Please fix the form errors before submitting');
      return;
    }

    const formValues = this.itemForm.value;

    if (this.isEditMode && this.itemId) {
      this.itemService.getItemById(this.itemId).subscribe(existingItem => {
        const updatedItem: Item = {
          ...formValues,
          id: this.itemId!,
          createdAt: existingItem?.createdAt || new Date(),
          updatedAt: new Date()
        };

        this.itemService.updateItem(updatedItem).subscribe(() => {
          this.notificationService.success(`Item "${formValues.name}" updated successfully`);
          this.router.navigate(['/items']);
        });
      });
    } else {
      const newItem: Item = {...formValues,};
      this.itemService.addItem(newItem).subscribe(() => {
        this.notificationService.success(`Item "${formValues.name}" added successfully`);
        this.router.navigate(['/items']);
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/items']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.itemForm.get(fieldName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.itemForm.get(fieldName);

    if (!control || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required';
    }

    if (control.errors['minlength']) {
      return `Minimum length is ${control.errors['minlength'].requiredLength} characters`;
    }

    if (control.errors['min']) {
      return `Value must be at least ${control.errors['min'].min}`;
    }

    return 'Invalid value';
  }

  private generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
