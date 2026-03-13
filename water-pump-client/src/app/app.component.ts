import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { NgIf } from '@angular/common';
import { AuthService } from './services/auth.service';
import { WebSocketService } from './services/webSocket.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [HeaderComponent, FooterComponent, NgIf, RouterOutlet],
})
export class AppComponent {
  constructor(private router: Router, private auth: AuthService,
    private socket: WebSocketService, private translate: TranslateService) {
    this.translate.onLangChange.subscribe((event) => {
      const lang = event.lang;
      const titles: { [key: string]: string } = {
        ru: 'Мониторинг',
        en: 'Monitoring',
        kz: 'Мониторинг'
      };
      document.title = titles[lang] || titles['ru'];
    });
  }
  
  isLoginPage(): boolean {
    return this.router.url === '/login';
  }
}
