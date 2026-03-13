import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../model/user.model';
import { WebSocketService } from './webSocket.service';

const BACKEND_URL_LOGIN = environment.apiUrl + '/auth/login';
const BACKEND_URL_REGISTER = environment.apiUrl + '/auth/register';
const BACKEND_URL_GET_ROLE = environment.apiUrl + '/auth/getRole';

@Injectable({
  providedIn: 'root',
})

export class AuthService {
  constructor(private http: HttpClient, private socket: WebSocketService) { }

  login(login: string, password: string): Observable<any> {
    return this.http.post(BACKEND_URL_LOGIN, { login, password }).pipe(
      map((res: any) => {
        this.saveToken(res.token, login, res.id);
        this.socket.init();
        return res;
      })
    );
  }

  register(user: User): Observable<any> {
    return this.http.post(BACKEND_URL_REGISTER, user);
  }

  saveToken(token: string, login: string, id: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user_login', login);
    localStorage.setItem('user_id', id);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getLogin(): string {
    return localStorage.getItem('user_login') || '';
  }

  getId(): string {
    return localStorage.getItem('user_id') || '';
  }

  getRole(): Observable<string> {
    const userId = this.getId();

    if (!userId) {
      return new Observable(observer => {
        observer.next('');
        observer.complete();
      });
    }

    return this.http.get<{ role: string }>(`${BACKEND_URL_GET_ROLE}/${userId}`).pipe(
      map(response => response.role),
      catchError(err => {
        return of('');
      })
    );
  }

  logout(): void {
    this.socket.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('user_login');
    localStorage.removeItem('user_id');
  }
}
