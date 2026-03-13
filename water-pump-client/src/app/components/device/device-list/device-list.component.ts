import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Device } from '../../../model/device.model';
import { DeviceService } from '../../../services/device.service';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss'],
})
export class DeviceListComponent {
  devices: Device[] = [];
  filteredDevices: Device[] = [];
  filterText: string = '';

  @Output() deviceSelected = new EventEmitter<Device>();
  @Output() createDevice = new EventEmitter<void>();
  @Input() userRole: string = '';
  selectedDevice: Device | null = null;
  isEditing: boolean = false;

  constructor(private deviceService: DeviceService, private translate: TranslateService) { }

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.deviceService.devices$.subscribe(devices => {
      this.devices = devices || [];
      this.filterDevices();
    });
  }

  selectDevice(device: Device): void {
    this.selectedDevice = device;
    this.deviceSelected.emit(device);
  }

  openCreateDeviceModal(): void {
    this.isEditing = false;
    this.createDevice.emit();
  }

  filterDevices(): void {
    const filterLower = this.filterText.toLowerCase();
    this.filteredDevices = this.devices.filter(device =>
      device.name?.toLowerCase().includes(filterLower)
    );
  }
}
