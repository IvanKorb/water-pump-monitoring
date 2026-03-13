import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../model/user.model';
import { environment } from '../../environments/environment';

const BACKEND_URL_USERS = environment.apiUrl + '/user/list';
const BACKEND_URL_CREATE_USER = environment.apiUrl + '/user/create';
const BACKEND_URL_UPDATE_USER = environment.apiUrl + '/user/update';
const BACKEND_URL_USER_DELETE = environment.apiUrl + '/user/delete';
@Injectable({
  providedIn: 'root',
})

export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUsers();
  }

  loadUsers(): void {
    this.http.get<User[]>(BACKEND_URL_USERS).subscribe((users) => {
      this.usersSubject.next(users);
    }, error => {});
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(BACKEND_URL_CREATE_USER, user).pipe(
      tap((newUser) => {
        const currentUsers = this.usersSubject.getValue();
        this.usersSubject.next([...currentUsers, newUser]);
      })
    );
  }

  updateUser(user: Partial<User>): Observable<User> {
    if (!user._id) {}
    return this.http.put<User>(`${BACKEND_URL_UPDATE_USER}/${user._id}`, user).pipe(
      tap((updatedUser) => {
        const currentUsers = this.usersSubject.getValue().map(u =>
          u._id === updatedUser._id ? updatedUser : u
        );
        this.usersSubject.next(currentUsers);
      })
    );
  }

  deleteUser(id?: string): Observable<void> {
    if (!id) {}
    return this.http.delete<void>(`${BACKEND_URL_USER_DELETE}/${id}`).pipe(
      tap(() => {
        const currentUsers = this.usersSubject.getValue().filter(u => u._id !== id);
        this.usersSubject.next(currentUsers);
      })
    );
  }

  changePassword(userId: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${BACKEND_URL_UPDATE_USER}/${userId}/password`, { newPassword });
  }
}
