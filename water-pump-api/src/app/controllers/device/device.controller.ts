import { Controller, Get, Post, Put, Delete, Body, Param, Patch, UseGuards } from '@nestjs/common';

import { Device } from '../../schemas/device.schema';
import { DeviceService } from 'src/app/services/device/device.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { MqttService } from 'src/app/services/mqtt/mqtt.service';

@UseGuards(JwtAuthGuard)
@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService, private readonly mqttService: MqttService) { }

  @Get('deviceswithtelemetry')
  getDeviceswithtelemetry(): Promise<Device[]> {
    return this.deviceService.getDevicesWithTelemetry();
  }

  @Get('listDevice')
  getDevices(): Promise<Device[]> {
    return this.deviceService.getDevices();
  }

  @Post('createDevice')
  createDevice(@Body() device: Device): Promise<Device> {
    return this.deviceService.createDevice(device);
  }

  @Put('updateDevice/:id')
  updateDevice(@Param('id') id: string, @Body() device: Device): Promise<Device> {
    return this.deviceService.updateDevice(id, device);
  }

  @Patch('updateDeviceStatus/:id')
  async updateDeviceStatus(
    @Param('id') id: string,
    @Body('isPower') isPower: boolean
  ): Promise<Device> {
    return this.deviceService.updateDeviceStatus(id, isPower);
  }

  @Delete('deleteDevice/:deviceId')
  deleteDevice(@Param('deviceId') id: string): Promise<void> {
    return this.deviceService.deleteDevice(id);
  }

  @Post('start/:devEui')
  async startPump(@Param('devEui') devEui: string) {
    await this.mqttService.sendPumpStart(devEui);
    await this.mqttService.sendStatusPoll(devEui); // через 10 сек
    return { ok: true };
  }

  @Post('stop/:devEui')
  async stopPump(@Param('devEui') devEui: string) {
    await this.mqttService.sendPumpStop(devEui);
    await this.mqttService.sendStatusPoll(devEui);
    return { ok: true };
  }
}
