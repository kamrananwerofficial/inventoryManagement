
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Item } from '../models/item.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private itemsSubject = new BehaviorSubject<Item[]>([]);
  public items$: Observable<Item[]> = this.itemsSubject.asObservable();

  constructor(private storageService: StorageService) {
    this.loadItems();
  }

  private loadItems(): void {
    const items = this.storageService.getItems();
    this.itemsSubject.next(items);
  }

  getItems(): Observable<Item[]> {
    return this.items$;
  }

  getItemById(id: string): Item | undefined {
    return this.storageService.getItemById(id);
  }

  addItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): void {
    const newItem: Item = {
      ...item,
      id: this.storageService.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.storageService.saveItem(newItem);
    this.loadItems();
  }

  updateItem(item: Item): void {
    this.storageService.saveItem({
      ...item,
      updatedAt: new Date()
    });
    this.loadItems();
  }

  deleteItem(id: string): void {
    this.storageService.deleteItem(id);
    this.loadItems();
  }

  updateItemQuantity(itemId: string, quantityChange: number): boolean {
    const success = this.storageService.updateItemQuantity(itemId, quantityChange);
    if (success) {
      this.loadItems();
    }
    return success;
  }

  searchItems(query: string): Item[] {
    query = query.toLowerCase().trim();
    if (!query) {
      return this.storageService.getItems();
    }
    
    return this.storageService.getItems().filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query) || 
      item.category.toLowerCase().includes(query) || 
      item.sku.toLowerCase().includes(query)
    );
  }

  getItemsByCategory(): { [category: string]: number } {
    const items = this.storageService.getItems();
    return items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = 0;
      }
      acc[item.category] += item.quantity;
      return acc;
    }, {} as { [category: string]: number });
  }

  getLowStockItems(): Item[] {
    return this.storageService.getItems().filter(item => 
      item.quantity <= item.reorderLevel
    );
  }
}
