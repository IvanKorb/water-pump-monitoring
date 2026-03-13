import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Device } from '../../model/device.model';
import { DeviceListComponent } from '../../components/device/device-list/device-list.component';
import { DeviceDetailComponent } from '../../components/device/device-detail/device-detail.component';
import { DeviceFormComponent } from '../../components/device/device-form/device-form.component';
import { DeviceService } from '../../services/device.service';
import { AuthService } from '../../services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { WebSocketService } from '../../services/webSocket.service';
import { Subscription } from 'rxjs';
import { Telemetry } from '../../model/telemetry.model';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, DeviceListComponent, DeviceDetailComponent, DeviceFormComponent],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
})

export class ReportComponent {
  selectedDevice: Device | null = null;
  showModal: boolean = false;
  isEditing: boolean = false;
  userRole!: string;
  telemetryHistory: Telemetry[] = [];
  lastDevEui: string | null = null;
  lastTelemetry: any = null;
  private telemetrySub?: Subscription;
  @ViewChild(DeviceListComponent, { static: false }) deviceListComponent!: DeviceListComponent;

  constructor(private readonly deviceService: DeviceService, private authService: AuthService, private translate: TranslateService,
    private readonly ws: WebSocketService) { }

  ngOnInit(): void {
    this.ws.init();

    this.telemetrySub = this.ws.listenTelemetry().subscribe(({ telemetry, device }) => {
      if (telemetry.devEui !== this.selectedDevice?.devEui) return;
      this.lastTelemetry = telemetry;

      this.telemetryHistory = [
        telemetry,
        ...this.telemetryHistory.filter(t => t._id !== (telemetry as any)._id)
      ]
        .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
        .slice(0, 50);

      if (device) {
        this.selectedDevice = { ...this.selectedDevice, ...device };
        this.deviceService.updateDeviceFromWs(device);
      }
    });

    this.authService.getRole().subscribe(
      (role) => {
        this.userRole = role;
      },
      (error) => {
      }
    );
  }

  onDeviceSelected(device: Device): void {
    if (this.lastDevEui) {
      this.ws.leaveDevice(this.lastDevEui);
    }

    this.selectedDevice = device;
    this.lastTelemetry = null;
    this.telemetryHistory = [];

    if (device.devEui) {
      this.ws.joinDevice(device.devEui);
      this.lastDevEui = device.devEui;
      this.deviceService.getDeviceTelemetry(device.devEui).subscribe({
        next: (packets) => {
          this.telemetryHistory = [...packets].sort(
            (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)
          );
          this.lastTelemetry = this.telemetryHistory[0] ?? null;
        },
        error: (err) => {
          console.error('[REPORT] getDeviceTelemetry error:', err);
          this.telemetryHistory = [];
          this.lastTelemetry = null;
        }
      });
    }

    this.showModal = false;
  }

  openCreateDeviceModal(): void {
    this.isEditing = false;
    this.showModal = true;
  }

  openEditDeviceModal(): void {
    this.isEditing = true;
    this.showModal = true;
  }

  onDeleteDevice(device: Device): void {
    if (device && device._id) {
      this.deviceService.deleteDevice(device._id).subscribe({
        next: () => {
          this.deviceListComponent.devices = this.deviceListComponent.devices.filter(dev => dev._id !== device._id);
          this.selectedDevice = null;
        },
        error: (error) => {
          console.error(this.translate.instant('ERRORS.DELETE_DEVICE'), error);
        },
      });
    } else {
      console.error(this.translate.instant('ERRORS.NO_DEVICE_ID'));
    }
  }

  onFormSubmit(device: Device): void {
    if (!this.isEditing) {
      this.showModal = false;
      this.selectedDevice = device;
    } else {
      this.deviceService.updateDevice(device).subscribe(updatedDevice => {
        const index = this.deviceListComponent.devices.findIndex(dev => dev._id === updatedDevice._id);
        if (index !== -1) {
          this.deviceListComponent.devices[index] = updatedDevice;
          this.deviceListComponent.selectDevice(updatedDevice);
          this.selectedDevice = updatedDevice;
        }
        this.showModal = false;
      });
    }
  }

  refreshDeviceList(): void {
    if (this.deviceListComponent) {
      this.deviceListComponent.loadDevices();
    }
  }

  closeModal(): void {
    this.showModal = false;
  }

  ngOnDestroy(): void {
    if (this.lastDevEui) {
      this.ws.leaveDevice(this.lastDevEui);
    }
    this.telemetrySub?.unsubscribe();
    this.ws.disconnect();
  }
}
