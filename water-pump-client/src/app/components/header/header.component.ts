import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  userRole: string | null = null;
  currentLang: string = 'ru';
  langMenuOpen = false;
  languages = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'kz', name: 'Қазақша', flag: '🇰🇿' }
  ];

  constructor(private router: Router, private authService: AuthService, private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || localStorage.getItem('lang') || 'ru';
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.authService.getRole().subscribe(
        (role) => {
          this.userRole = role;
        },
        (error) => {
           console.error(this.translate.instant('ERRORS.GET_ROLE'), error.message);
        }
      );
    }
  }

  switchLanguage(lang: string): void {
    this.translate.use(lang);
    this.currentLang = lang;
    localStorage.setItem('lang', lang);
    this.langMenuOpen = false;
  }
  toggleLangMenu(): void {
    this.langMenuOpen = !this.langMenuOpen;
  }
  navigateToUser() {
    this.router.navigate(['/user']);
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.language-dropdown')) {
      this.langMenuOpen = false;
    }
  }
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
