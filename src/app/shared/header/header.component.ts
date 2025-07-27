
import { Component, OnInit } from '@angular/core';
import { ItemService } from '../../services/item.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  lowStockCount = 0;
  isMenuCollapsed = true;

  constructor(private itemService: ItemService) {}

  ngOnInit(): void {
    // Subscribe to item changes to update low stock count
    this.itemService.items$.subscribe(items => {
      this.lowStockCount = items.filter(item => item.quantity <= item.reorderLevel).length;
    });
  }
}
