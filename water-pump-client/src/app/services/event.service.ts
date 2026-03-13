import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BACKEND_URL_CREATE_DEVICE = environment.apiUrl + '/telemetries/getPacketCount';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  constructor(private http: HttpClient) { }

  getPacketCount(devEui: string): Observable<number> {
    const url = `${BACKEND_URL_CREATE_DEVICE}/${devEui}`;
    return this.http.get<{ counterPacket: number }>(url).pipe(
      map(response => response.counterPacket)
    );
  }


}
