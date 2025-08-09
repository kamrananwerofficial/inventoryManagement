
import { Component, OnInit } from '@angular/core';
import { ItemService } from '../../../services/item.service';
import { NotificationService } from '../../../services/notification.service';
import { Item } from '../../../models/item.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-item-list',
  templateUrl: './itemlist.component.html',
  styleUrls: ['./itemlist.component.css']
})
export class ItemlistComponent implements OnInit {
  items: Item[] = [];
  filteredItems: Item[] = [];
  searchTerm = '';
  selectedCategory = '';
  categories: string[] = [];
  sortField = 'name';
  sortDirection = 'asc';
  isLoading:boolean = false; // loading state
  itemToDelete: Item | null = null;

  constructor(
    private itemService: ItemService,
    private notificationService: NotificationService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.isLoading = true; // Set loading state
    this.itemService.getItems().subscribe(items => {
      this.items = items;
      this.filterItems();
      this.isLoading = false; // Reset loading state
      
      // Extract unique categories
      this.categories = Array.from(new Set(items.map(item => item.category)));
    });
  }

  filterItems(): void {
    let filtered = [...this.items];
    
    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(item => item.category === this.selectedCategory);
    }
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(search) || 
        item.description.toLowerCase().includes(search) || 
        item.sku.toLowerCase().includes(search)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let fieldA: any = a[this.sortField as keyof Item];
      let fieldB: any = b[this.sortField as keyof Item];
      
      // Handle string comparison
      if (typeof fieldA === 'string') {
        fieldA = fieldA.toLowerCase();
        fieldB = fieldB.toLowerCase();
      }
      
      if (fieldA < fieldB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (fieldA > fieldB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    this.filteredItems = filtered;
  }

  onSearch(): void {
    this.filterItems();
  }

  onCategoryChange(): void {
    this.filterItems();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      // Toggle sort direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.filterItems();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return 'fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  confirmDelete(modal: any, item: Item): void {
    this.itemToDelete = item;
    this.modalService.open(modal, { centered: true });
  }

   deleteItem(){
    if (this.itemToDelete) {
      this.itemService.deleteItem(this.itemToDelete.id).subscribe({
        next: () => {
          this.notificationService.success(`Item "${this.itemToDelete?.name}" deleted successfully`);
          this.modalService.dismissAll();
          this.itemToDelete = null;
  },
  error: (error) => {
    console.error('Delete failed:', error);
    // Show error message if needed
  }
});
    }
  }

  getStockStatus(item: Item): { status: string; class: string } {
    if (item.quantity <= 0) {
      return { status: 'Out of Stock', class: 'bg-danger' };
    } else if (item.quantity <= item.reorderLevel) {
      return { status: 'Low Stock', class: 'bg-warning text-dark' };
    } else {
      return { status: 'In Stock', class: 'bg-success' };
    }
  }
}
