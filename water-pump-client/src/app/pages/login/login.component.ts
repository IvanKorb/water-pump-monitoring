import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { User } from '../../model/user.model';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  isSignUpMode = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {
    this.loginForm = this.fb.group({
      login: ['admin', Validators.required],
      password: ['admin', Validators.required],
    });
  }

  toggleMode() {
    this.isSignUpMode = !this.isSignUpMode;
    this.loginForm.reset();
  }
  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/monitoring']);
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { login, password } = this.loginForm.value;
      const user: User = { login, password };

      if (this.isSignUpMode) {
        this.authService.register(user).subscribe(
          (response) => {
            this.toggleMode();
          },
          (error) => {
            console.error('error:', error);
          }
        );
      } else {
        this.authService.login(login, password).subscribe(
          (response) => {
            if (response?.token && response?.token?.token && response?.token?.id) {
              this.authService.saveToken(response.token.token, login, response.token.id);
              this.router.navigate(['/monitoring']);
            } else {
            }
          },
          (error) => {
            alert(this.translate.instant('ERRORS.LOGIN'));
          }
        );
      }
    }
  }
}
