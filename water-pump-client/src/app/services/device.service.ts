import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Device } from '../model/device.model';

import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { WebSocketService } from './webSocket.service';
import { Telemetry } from '../model/telemetry.model';

const BACKEND_URL_CREATE_DEVICE = environment.apiUrl + '/device/createDevice';
const BACKEND_URL_UPDATE_DEVICE = environment.apiUrl + '/device/updateDevice';
const BACKEND_URL_UPDATE_DEVICE_STATUS = environment.apiUrl + '/device/updateDeviceStatus';
const BACKEND_URL_LIST_DEVICE = environment.apiUrl + '/device/listDevice';
const BACKEND_URL_DELETE_DEVICE = environment.apiUrl + '/device/deleteDevice';
const BACKEND_URL_DEVICE_WITH_EVENTS = environment.apiUrl + '/device/deviceswithtelemetry';
const BACKEND_URL_TELEMETRY_BY_DEVICE = environment.apiUrl + '/telemetries';
const BACKEND_PUMP_START = environment.apiUrl + '/device/start';
const BACKEND_PUMP_STOP = environment.apiUrl + '/device/stop';
@Injectable({
  providedIn: 'root',
})
export class DeviceService {

  private devicesSubject = new BehaviorSubject<Device[]>([]);
  devices$ = this.devicesSubject.asObservable();
  constructor(
    private http: HttpClient,
    private webSocketService: WebSocketService
  ) {
    this.loadDevicesWithTelemetry();
    this.webSocketService.init();
    this.subscribeToWebSocketTelemetry();
  }
  private loadDevicesWithTelemetry(): void {
    this.http
      .get<Device[]>(BACKEND_URL_DEVICE_WITH_EVENTS)
      .subscribe((devices) => this.devicesSubject.next(devices || []));
  }

  private subscribeToWebSocketTelemetry(): void {
    this.webSocketService.listenTelemetry().subscribe({
      next: ({ device }) => {
        if (!device?.devEui) return;
        this.updateDeviceFromWs(device);
      },
      error: (e) => console.error('[WS] telemetry stream error:', e),
    });
  }

  public updateDeviceFromWs(partial: Device): void {
    const current = this.getCurrentDevices();
    const idx = current.findIndex(d => d.devEui === partial.devEui);

    if (idx === -1) {
      return;
    }

    const updated: Device = {
      ...current[idx],
      ...partial,
    };

    const next = [...current];
    next[idx] = updated;
    this.devicesSubject.next(next);
  }

  getDevicesWithTelemetry(): Observable<Device[]> {
    return this.http.get<Device[]>(BACKEND_URL_DEVICE_WITH_EVENTS).pipe(
      tap(devices => this.devicesSubject.next(devices))
    );
  }

  public getCurrentDevices(): Device[] {
    return this.devicesSubject.getValue();
  }

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(BACKEND_URL_LIST_DEVICE);
  }

  createDevice(device: Device): Observable<Device> {
    return this.http.post<Device>(BACKEND_URL_CREATE_DEVICE, device).pipe(
      tap(newDevice => {
        const currentDevices = this.getCurrentDevices();
        this.devicesSubject.next([newDevice, ...currentDevices]);
      })
    );
  }

  updateDevice(device: Device): Observable<Device> {
    return this.http.put<Device>(`${BACKEND_URL_UPDATE_DEVICE}/${device._id}`, device).pipe(
      tap(updatedDevice => {
        const currentDevices = this.getCurrentDevices().map(dev => dev._id === updatedDevice._id ? updatedDevice : dev);
        this.devicesSubject.next(currentDevices);
      })
    );
  }


  getDeviceTelemetry(devEui: string, startDate?: any, endDate?: any): Observable<Telemetry[]> {
    let url = `${BACKEND_URL_TELEMETRY_BY_DEVICE}/${devEui}`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get<Telemetry[]>(url);
  }

  updateDeviceStatus(deviceId: string, isPower: boolean): Observable<Device> {
    return this.http.patch<Device>(`${BACKEND_URL_UPDATE_DEVICE_STATUS}/${deviceId}`, { isPower }).pipe(
      tap(updatedDevice => {

        const currentDevices = this.getCurrentDevices().map(dev => dev._id === updatedDevice._id ? updatedDevice : dev);
        this.devicesSubject.next(currentDevices);
      })
    );
  }

  deleteDevice(deviceId: string): Observable<void> {
    return this.http.delete<void>(`${BACKEND_URL_DELETE_DEVICE}/${deviceId}`).pipe(
      tap(() => {
        const currentDevices = this.getCurrentDevices().filter(dev => dev._id !== deviceId);
        this.devicesSubject.next(currentDevices);
      })
    );
  }

  startPump(devEui: string): Observable<any> {
    return this.http.post(`${BACKEND_PUMP_START}/${devEui}`, {});
  }

  stopPump(devEui: string): Observable<any> {
    return this.http.post(`${BACKEND_PUMP_STOP}/${devEui}`, {});
  }
}
