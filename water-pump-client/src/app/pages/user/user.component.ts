import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { User } from '../../model/user.model';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule], 
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit {
  selectedUser: User = { login: '', password: '' };
  showModal: boolean = false;
  isEditing: boolean = false;
  users: User[] = [];
  showChangePasswordModal: boolean = false;
  showDeleteModal: boolean = false;
  userToDelete: User | null = null;
  newPassword: string = '';
  userRole: string | null = null;

  constructor(private readonly userService: UserService, private authService: AuthService,
    private translate: TranslateService) {}

  ngOnInit(): void {
    this.authService.getRole().subscribe(
      (role) => {
        this.userRole = role;
      },
      (error) => {
          console.error(this.translate.instant('ERRORS.DELETE_USER'), error);
      }
    );
    this.loadUsers();
  }

  openChangePasswordModal(): void {
    this.showChangePasswordModal = true;
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal = false;
    this.newPassword = '';
  }
  onPasswordChangeSubmit(passwordFormValue: { newPassword: string }): void {
    const userId = this.authService.getId();
    this.userService.changePassword(userId, passwordFormValue.newPassword).subscribe({
      next: () => {
        this.closeChangePasswordModal();
      },
      error: (error) => {
        console.error(this.translate.instant('ERRORS.CHANGE_PASSWORD'), error);
      },
    });
  }

  loadUsers(): void {
    this.userService.users$.subscribe((users) => {
      this.users = users;
    });
  }

  openCreateUserModal(): void {
    this.isEditing = false;
    this.selectedUser = { login: '', password: '' };
    this.showModal = true; 
  }

  onEditUser(user: User): void {
    this.selectedUser = { ...user, password: '' };
    this.isEditing = true;
    this.showModal = true; 
  }

  onFormSubmit(userFormValue: User): void {
    if (!this.isEditing) {
      this.userService.createUser(userFormValue).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
        },
        error: (error) => {
          console.error(this.translate.instant('ERRORS.CREATE_USER'), error);
        }
      });
    } else {
      if (userFormValue._id) {
        const updateData: Partial<User> = { ...userFormValue };
        if (!updateData.password || updateData.password.trim() === '') {
          delete updateData.password;
        }
        
        this.userService.updateUser(updateData).subscribe({
          next: () => {
            this.loadUsers();
            this.closeModal();
          },
          error: (error) => {
            console.error(this.translate.instant('ERRORS.UPDATE_USER'), error);
          }
        });
      } else {
        console.error(this.translate.instant('ERRORS.NO_USER_ID'));
      }
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
  }

  onDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.userToDelete && this.userToDelete._id) {
      this.userService.deleteUser(this.userToDelete._id).subscribe({
        next: () => {
          this.loadUsers();
          this.closeDeleteModal();
        },
        error: (error) => {
          console.error(this.translate.instant('ERRORS.DELETE_USER'), error);
        },
      });
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }
}
