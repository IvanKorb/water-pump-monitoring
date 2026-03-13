import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../model/device.model';
import { DeviceService } from '../../../services/device.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-device-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './device-form.component.html',
  styleUrls: ['./device-form.component.scss'],
})
export class DeviceFormComponent implements OnInit {
  @Input() device: Device | null = null;
  @Output() formSubmit = new EventEmitter<Device>();
  @Input() showModal = false;
  @Output() closeModalEvent = new EventEmitter<void>();

  deviceData: Device = {name: '', description: '', devEui: ''
  };
  errorMessage: string | null = null;

  constructor(private deviceService: DeviceService, private translate: TranslateService) { }

  ngOnInit(): void {
    if (this.device) {
      this.deviceData = { ...this.device };
    } else {
      this.deviceData = {
        name: '', description: '', devEui: ''
      };
    }
  }

  onSubmit(): void {
    this.errorMessage = null;
    if (this.deviceData._id) {
      this.deviceService.updateDevice(this.deviceData).subscribe({
        next: (updatedDevice) => {
          this.formSubmit.emit(updatedDevice);
        },
        error: (error) => {
          this.handleError(error);
        }
      });
    } else {
      this.deviceService.createDevice(this.deviceData).subscribe({
        next: (newDevice) => {
          this.formSubmit.emit(newDevice);
        },
        error: (error) => {
          this.handleError(error);
        }
      });
    }
  }

  handleError(error: any) {
    this.errorMessage = error.error.message || this.translate.instant('ERRORS.SAVE_ERROR');
  }

  closeModalByClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal')) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }
}
