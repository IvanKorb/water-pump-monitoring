import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Device } from '../../../model/device.model';
import { EventService } from '../../../services/event.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
import { Telemetry } from '../../../model/telemetry.model';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DeviceService } from '../../../services/device.service';
import { NoGroupNumberPipe } from '../../../pipe/noGroupNumberPipe';
@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, NoGroupNumberPipe],
  templateUrl: './device-detail.component.html',
  styleUrls: ['./device-detail.component.scss'],
})
export class DeviceDetailComponent {
  @Input() latestTelemetry: Telemetry | null = null;
  @Input() telemetryHistory: Telemetry[] = [];
  @Input() device: Device | null = null;
  @Input() userRole: string = '';
  @Output() editDeviceEvent = new EventEmitter<void>();
  @Output() deleteDeviceEvent = new EventEmitter<void>();
  counterPacket: number | null = null;
  showDeleteModal = false;
  displayTelemetry: Telemetry[] = [];
  showPumpConfirm = false;
  pumpAction: 'start' | 'stop' | null = null;

  dateFrom: string | null = null; // 'YYYY-MM-DD'
  dateTo: string | null = null;
  isHistoryMode = false;
  isLoadingHistory = false;

  pumpPending = false;
  lastCommand: 'start' | 'stop' | null = null;
  constructor(private eventService: EventService, private deviceService: DeviceService,
    private translate: TranslateService) { }

  ngOnChanges(changes: SimpleChanges): void {
    // console.log('[DETAIL] latestTelemetry changed:', this.latestTelemetry);
    // console.log('[DETAIL] device changed:', this.device);

    if (changes['device'] && this.device?.devEui) {
      this.loadPacketCount(this.device.devEui);
      this.resetDateFilter(false);
    }

    if (changes['telemetryHistory'] && !this.isHistoryMode) {
      this.displayTelemetry = this.telemetryHistory ? [...this.telemetryHistory] : [];
    }

    if (changes['latestTelemetry'] && this.latestTelemetry) {
      this.checkPumpUnlock();
    }
  }

  loadPacketCount(devEui: string): void {
    this.eventService.getPacketCount(devEui).subscribe({
      next: (count) => {
        this.counterPacket = count;
      },
      error: (error) => {
        console.error(this.translate.instant('ERRORS.PACKET_COUNT'), error);
        this.counterPacket = null;
      }
    });
  }

  editDevice(): void {
    this.editDeviceEvent.emit();
  }

  deleteDevice(): void {
    this.deleteDeviceEvent.emit();
  }

  showDeleteConfirmation(): void {
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    this.deleteDevice();
    this.showDeleteModal = false;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }

  applyDateFilter(): void {
    if (!this.device?.devEui || !this.dateFrom || !this.dateTo) {
      return;
    }

    const fromDate = new Date(this.dateFrom);
    const toDate = new Date(this.dateTo);

    toDate.setHours(23, 59, 59, 999);

    this.isLoadingHistory = true;

    this.deviceService
      .getDeviceTelemetry(
        this.device.devEui,
        fromDate.toISOString(),
        toDate.toISOString()
      )
      .subscribe({
        next: (data) => {
          this.displayTelemetry = (data || []).sort(
            (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
          );
          this.isHistoryMode = true;
          this.isLoadingHistory = false;
        },
        error: (err) => {
          console.error(
            this.translate.instant('ERRORS.TELEMETRY_HISTORY_RANGE') || 'History load error',
            err
          );
          this.isLoadingHistory = false;
        },
      });
  }

  resetDateFilter(clearDates: boolean = true): void {
    this.isHistoryMode = false;
    this.isLoadingHistory = false;

    if (clearDates) {
      this.dateFrom = null;
      this.dateTo = null;
    }

    this.displayTelemetry = this.telemetryHistory ? [...this.telemetryHistory] : [];
  }

  closeDeleteModalByClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal')) {
      this.closeDeleteModal();
    }
  }

  exportData(format: 'excel') {
    if (format !== 'excel') return;

    const rows = this.displayTelemetry || [];
    if (!rows.length) {
      console.warn('Нет данных телеметрии для экспорта');
      return;
    }

    const nameLabel = this.translate.instant('DEVICE_EVENTS.FILE_NAME_LABEL');
    const createdLabel = this.translate.instant('DEVICE_EVENTS.FILE_CREATED');

    const currentDate = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const fileName = `${nameLabel} ${this.device?.name || 'name'} ${createdLabel} ${currentDate}.xlsx`;

    const t = (key: string, fallback: string): string => {
      const v = this.translate.instant(key);
      return v && v !== key ? v : fallback;
    };

    const timeLabel = t('DEVICE_EVENTS.TIME', 'Время');
    const driveLabel = t('DEVICE_DETAIL.DRIVE_METRICS', 'Частотный преобразователь');
    const meterLabel = t('DEVICE_DETAIL.METER_PHASES', 'Измеритель электроэнергии');
    const flowLabel = t('DEVICE_DETAIL.FLOW_METER', 'Расходомер');

    const headerGroupRow = [
      timeLabel,
      driveLabel, '', '', '', '',
      meterLabel, '', '', '', '', '',
      flowLabel, '', '', '', ''
    ];
    const sumDeltaVd = this.calcDeltaVdSumForExport(rows);

    const headerLabelRow = [
      't',
      'f_out',
      'f_set',
      'I_out',
      'U_out',
      'status',
      'U_A',
      'U_B',
      'U_C',
      'I_A',
      'I_B',
      'I_C',
      'Q',
      'v',
      'V_d',
      'dVd',
      'V_r',
    ];
    headerLabelRow[15] = `ΣΔVd=${sumDeltaVd.toFixed(2)}`;
    const dataRows = rows.map((tRow, i) => {
      const cur = tRow.positiveAccumulator;
      const prev = rows[i + 1]?.positiveAccumulator;
      const dVd = (cur != null && prev != null) ? (cur - prev) : '';

      return [
        this.formatTimestamp(tRow.timestamp),
        tRow.outputfrequency ?? '',
        tRow.setfrequency ?? '',
        tRow.outputcurrent ?? '',
        tRow.outputvoltage ?? '',
        tRow.inverterrunningstatus ?? '',
        tRow.ch1AphaseVoltage ?? '',
        tRow.ch1BphaseVoltage ?? '',
        tRow.ch1CphaseVoltage ?? '',
        tRow.ch1AphaseCurrent ?? '',
        tRow.ch1BphaseCurrent ?? '',
        tRow.ch1CphaseCurrent ?? '',
        tRow.flowRate ?? '',
        tRow.velocity ?? '',
        tRow.positiveAccumulator ?? '',
        dVd,
        tRow.negativeAccumulator ?? '',
      ];
    });

    const worksheetData = [headerGroupRow, headerLabelRow, ...dataRows];

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet['!merges'] = [
      { s: { r: 0, c: 1 }, e: { r: 0, c: 5 } },
      { s: { r: 0, c: 6 }, e: { r: 0, c: 11 } },
      { s: { r: 0, c: 12 }, e: { r: 0, c: 16 } },
    ];

    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'telemetry');

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    this.saveAsExcelFile(excelBuffer, fileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(data, fileName);
  }

  private formatTimestamp(timestamp?: number): string {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  checkPumpUnlock() {
    if (!this.pumpPending || !this.latestTelemetry) return;

    const t = this.latestTelemetry;

    if (this.lastCommand === 'start' && this.pumpState === 'stop') {
      this.pumpPending = false;
      this.lastCommand = null;
    }

    if (this.lastCommand === 'stop' && this.pumpState === 'start') {
      this.pumpPending = false;
      this.lastCommand = null;
    }
  }

  startPump() {
    if (!this.device?.devEui) return;
    this.pumpPending = true;
    this.lastCommand = 'start';

    this.deviceService.startPump(this.device.devEui).subscribe({
      next: () => console.log('startPump отправлена'),
      error: err => {
        console.error(err);
        this.pumpPending = false;
      }
    });
  }

  stopPump() {
    if (!this.device?.devEui) return;
    this.pumpPending = true;
    this.lastCommand = 'stop';

    this.deviceService.stopPump(this.device.devEui).subscribe({
      next: () => console.log('stopPump отправлена'),
      error: err => {
        console.error(err);
        this.pumpPending = false;
      }
    });
  }

  getPumpButtonState(t: Telemetry): 'start' | 'stop' {
    const r = t.running;
    const a = t.accelerating;
    const d = t.decelerating;
    const c = t.constantSpeed;

    // 1) 0 0 0 1 → ПУСК
    if (!r && !a && !d && c) return 'start';

    // 2) 1 1 0 0 → СТОП
    if (r && a && !d && !c) return 'stop';

    // 3) 1 0 1 0 → ПУСК (переходный процесс)
    if (r && !a && d && !c) return 'start';

    // 4) 1 0 0 1 → СТОП
    if (r && !a && !d && c) return 'stop';

    return r ? 'stop' : 'start';
  }

  get pumpState(): 'start' | 'stop' {
    if (!this.latestTelemetry) return 'start';
    return this.getPumpButtonState(this.latestTelemetry);
  }

  openPumpConfirm() {
    if (!this.device?.devEui) return;

    this.pumpAction = this.pumpState === 'stop' ? 'stop' : 'start';
    this.showPumpConfirm = true;
  }

  closePumpConfirm() {
    this.showPumpConfirm = false;
    this.pumpAction = null;
  }

  closePumpConfirmByOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal')) {
      this.closePumpConfirm();
    }
  }

  confirmPumpAction() {
    if (this.pumpAction === 'start') this.startPump();
    if (this.pumpAction === 'stop') this.stopPump();

    this.closePumpConfirm();
  }

  getDeltaVd(index: number): number | null {
    const cur = this.displayTelemetry?.[index]?.positiveAccumulator;
    const prev = this.displayTelemetry?.[index + 1]?.positiveAccumulator;

    if (cur == null || prev == null) return null;

    const delta = cur - prev;
    return Number.isFinite(delta) ? delta : null;
  }

  getDeltaVdSum(): number {
    if (!this.displayTelemetry?.length) return 0;

    let sum = 0;
    for (let i = 0; i < this.displayTelemetry.length - 1; i++) {
      const d = this.getDeltaVd(i);
      if (d != null) sum += d;
    }
    return sum;
  }


  private calcDeltaVdSumForExport(rows: Telemetry[]): number {
    if (!rows?.length) return 0;

    let sum = 0;
    for (let i = 0; i < rows.length - 1; i++) {
      const cur = rows[i]?.positiveAccumulator;
      const prev = rows[i + 1]?.positiveAccumulator;
      if (cur == null || prev == null) continue;

      const d = cur - prev;
      if (Number.isFinite(d)) sum += d;
    }
    return sum;
  }
}
