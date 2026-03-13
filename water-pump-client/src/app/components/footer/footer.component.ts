import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, TranslateModule],
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  currentTime: string = '';
  isModalVisible = false;
  currentUser: any = null;
  currentYear = new Date().getFullYear();
  intervalId: any;
  
  constructor(
    private authService: AuthService,
  ) {
  }

  ngOnInit() {
    this.currentUser = this.authService.getLogin();
    this.updateTime();
  }

  updateTime() {
    this.currentTime = new Date().toLocaleTimeString();
    this.intervalId = setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString();
    }, 1000);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
