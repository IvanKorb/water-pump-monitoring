import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, takeUntil } from 'rxjs';
import { environment } from '../../environments/environment';
import { Telemetry } from '../model/telemetry.model';
import { Device } from '../model/device.model';
interface TelemetryWsPayload {
  telemetry: Telemetry;
  device: Device | null;
}
const BACKEND_URL_WSS_CONNECT = environment.apiUrlWss;
@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket!: Socket;
  private connected = false;

  constructor() { }

  init(): void {
    if (!this.connected) {
      this.socket = io(BACKEND_URL_WSS_CONNECT, {
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      this.connected = true;

      this.socket.on('connect', () => {
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
      });
    } else {
      console.log('[WS] init → already connected, skip');
    }
  }

  listenTelemetry(): Observable<TelemetryWsPayload> {
    return new Observable(sub => {
      const handler = (data: TelemetryWsPayload) => sub.next(data);
      this.socket.on('telemetry', handler);
      return () => this.socket.off('telemetry', handler);
    });
  }

  joinDevice(devEui: string): void {
    this.socket.emit('joinDevice', devEui);
  }

  leaveDevice(devEui: string): void {
    this.socket.emit('leaveDevice', devEui);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }
}