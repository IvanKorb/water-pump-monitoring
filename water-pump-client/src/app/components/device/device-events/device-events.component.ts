import { Component, Input, OnChanges } from '@angular/core';
import { Device } from '../../../model/device.model';
import { DeviceService } from '../../../services/device.service';
import { EventDocument } from '../../../model/telemetry.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-device-events',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './device-events.component.html',
  styleUrl: './device-events.component.scss'
})
export class DeviceEventsComponent implements OnChanges {
  @Input() device: Device | null = null;
  currentUser: string = '';
  events: EventDocument[] = [];
  startDate: string | null = null;
  endDate: string | null = null;

  showResetModal = false;

  constructor(private deviceService: DeviceService, private authService: AuthService, private translate: TranslateService) {
    this.currentUser = authService.getLogin();
  }

  ngOnChanges(): void {
    if (this.device?.devEui) {
      this.startDate = null;
      this.endDate = null;
      this.loadEvents();
    }
  }

  loadEvents(startDate?: string | null, endDate?: string | null): void {
    const formattedStartDate = startDate ? new Date(startDate).toISOString() : undefined;
    const formattedEndDate = endDate ? new Date(endDate).toISOString() : undefined;
    const devEui = this.device?.devEui ? this.device.devEui : '';
    this.deviceService.getDeviceEvents(devEui, formattedStartDate, formattedEndDate)
      .subscribe((data: EventDocument[]) => {
        this.events = data;
      });
  }

  resetAllAlerts(): void {
    if (!this.device?.devEui) return;
    this.showResetModal = true;
  }

  closeResetModal(): void {
    this.showResetModal = false;
  }

  closeResetModalByClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal')) {
      this.closeResetModal();
    }
  }

  confirmResetAlerts(): void {
    if (this.device?.devEui) {
      this.deviceService.confirmAllEventsByDevEui(this.device.devEui, this.currentUser).subscribe(() => {
        this.loadEvents();
        this.closeResetModal();
      });
    }
  }

  confirmEvent(event: EventDocument): void {
    event.status = 'confirmed';
    event.operatorName = this.currentUser;
    event.acceptedAt = Date.now();

    this.deviceService.updateEventStatus(event).subscribe(() => {
      const eventIndex = this.events.findIndex(e => e._id === event._id);
      if (eventIndex !== -1) {
        this.events[eventIndex] = { ...event };
      }
    });
  }

  exportData(format: 'excel') {
    if (!this.events || this.events.length === 0) {
      return;
    }
    const confirmed = this.translate.instant('STATUS.CONFIRMED');
    const canceled = this.translate.instant('STATUS.CANCELED');
    const nameLabel = this.translate.instant('DEVICE_EVENTS.FILE_NAME_LABEL');
    const createdLabel = this.translate.instant('DEVICE_EVENTS.FILE_CREATED');
    const worksheet = XLSX.utils.json_to_sheet(
      this.events.map(event => {
        const statusKey = event.status?.toUpperCase();
        const translatedStatus = statusKey
          ? this.translate.instant('STATUS.' + statusKey)
          : '';

        return {
          [this.translate.instant('DEVICE_EVENTS.TIME')]: event.timestamp
            ? new Date(event.timestamp).toLocaleString('ru-RU')
            : '',
          [this.translate.instant('DEVICE_EVENTS.UPPER')]: event.input2
            ? this.translate.instant('STATUS.EXCEEDED')
            : this.translate.instant('STATUS.NORMAL'),
          [this.translate.instant('DEVICE_EVENTS.ALARM_UPPER')]: event.input1
            ? this.translate.instant('STATUS.EXCEEDED')
            : this.translate.instant('STATUS.NORMAL'),
          'RSSI [dBm]': event.rssi,
          [this.translate.instant('DEVICE_EVENTS.STATUS_CONFIRM')]:
            event.status === 'confirmed' || event.status === 'canceled'
              ? `${new Date(event.acceptedAt!).toLocaleString('ru-RU')} ${event.operatorName} ${translatedStatus}`
              : (event.input1 || event.input2)
                ? this.translate.instant('DEVICE_EVENTS.STATUS_REQUIRED')
                : ''
        };
      })
    );

    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 8 },
      { wch: 60 }
    ];

    const workbook: XLSX.WorkBook = {
      Sheets: { 'Events': worksheet },
      SheetNames: ['Events']
    };

    const currentDate = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const fileName = `${nameLabel} ${this.device?.name || 'name'} ${createdLabel} ${currentDate}.xlsx`;
    this.saveAsExcelFile(excelBuffer, fileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(data, fileName);
  }
}

