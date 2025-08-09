
import { Component, OnInit } from '@angular/core';
import { ItemService } from '../../services/item.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  lowStockCount = 0;
  isMenuCollapsed = true;

  constructor(private itemService: ItemService) {}

  adminOnly(): boolean {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      return userData.username?.toUpperCase() === 'KAMRANALI' && userData.email?.toUpperCase() === 'KAMRANANWERFANCY@GMAIL.COM';
    }
    return false;
  }
  ngOnInit(): void {
    this.itemService.headerSubject.subscribe((hasLowStock) => {
          this.lowStockCount = hasLowStock?.length || 0;
    });

  }
}
