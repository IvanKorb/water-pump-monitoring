import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device } from '../../schemas/device.schema';
import { Telemetry } from 'src/app/schemas/telemetry.schema';

@Injectable()
export class DeviceService {

  constructor(@InjectModel('Device') private deviceModel: Model<Device>,
    @InjectModel('Telemetry') private telemetryModel: Model<Telemetry>) { }

  async getDevices(): Promise<Device[]> {
    return this.deviceModel.find().exec();
  }
  async updateDevice(id: string, device: Device): Promise<Device> {
    if (device.devEui) {
      device.devEui = device.devEui.toUpperCase();
      const currentDevice = await this.deviceModel.findById(id).exec();
      if (currentDevice && currentDevice.devEui !== device.devEui) {
        const existingDevice = await this.deviceModel.findOne({ devEui: device.devEui, _id: { $ne: id } }).exec();
        if (existingDevice) {
          throw new HttpException('Устройство с таким DevEUI уже существует.', HttpStatus.BAD_REQUEST);
        }
      }
    }
    return this.deviceModel.findByIdAndUpdate(id, device, { new: true }).exec();
  }

  async getDevicesWithTelemetry(): Promise<Device[]> {
    //console.log('Getting devices with telemetry sorted by name...');
    return this.deviceModel.find().collation({ locale: 'ru', numericOrdering: true }).sort({ name: 1 }).exec();
  }

  async createDevice(device: Device): Promise<Device> {
    device.devEui = device.devEui.toUpperCase();

    const existingDevice = await this.deviceModel.findOne({ devEui: device.devEui });
    if (existingDevice) {
      throw new HttpException('Устройство с таким DevEUI уже существует.', HttpStatus.BAD_REQUEST);
    }

    const newDevice = new this.deviceModel(device);
    return newDevice.save();
  }

  async updateFromTelemetry(t: Telemetry): Promise<Device | null> {
    const updateFields: Partial<Device> = {
      timestamp: t.timestamp,
      rssi: t.rssi,
      snr: t.snr,

      outputfrequency: t.outputfrequency,
      setfrequency: t.setfrequency,
      outputcurrent: t.outputcurrent,
      outputvoltage: t.outputvoltage,

      ch1AphaseVoltage: t.ch1AphaseVoltage,
      ch1BphaseVoltage: t.ch1BphaseVoltage,
      ch1CphaseVoltage: t.ch1CphaseVoltage,
      ch1AphaseCurrent: t.ch1AphaseCurrent,
      ch1BphaseCurrent: t.ch1BphaseCurrent,
      ch1CphaseCurrent: t.ch1CphaseCurrent,

      flowRate: t.flowRate,
      velocity: t.velocity,
      positiveAccumulator: t.positiveAccumulator,
      negativeAccumulator: t.negativeAccumulator,

      running: t.running,
      reverse: t.reverse,
      zeroSpeed: t.zeroSpeed,
      accelerating: t.accelerating,
      decelerating: t.decelerating,
      constantSpeed: t.constantSpeed,
      preExcitation: t.preExcitation,

      autoTuning: t.autoTuning,
      overcurrentLimit: t.overcurrentLimit,
      overvoltageLimit: t.overvoltageLimit,
      torqueLimit: t.torqueLimit,
      speedLimit: t.speedLimit,
      speedControl: t.speedControl,
      torqueControl: t.torqueControl,
    };

    return this.deviceModel
      .findOneAndUpdate(
        { devEui: t.devEui },
        {
          $set: updateFields,
          $inc: { counterPacket: 1 },
        },
        { new: true },
      )
      .lean()
      .exec();
  }

  async updateDeviceStatus(id: string, isPower: boolean): Promise<Device> {
    return this.deviceModel.findByIdAndUpdate(id, { isPower }, { new: true }).exec();
  }

  async deleteDevice(id: string): Promise<void> {
    await this.deviceModel.findByIdAndDelete(id).exec();
  }

  async getDeviceById(id: string): Promise<Device> {
    return this.deviceModel.findById(id).exec();
  }

  async updatePartialDeviceData(devEui: string, updateFields: Partial<Device>): Promise<Device> {
    return this.deviceModel.findOneAndUpdate(
      { devEui },
      { $set: updateFields },
      { new: true }
    )
      .lean()
      .exec();
  }

  async getTelemetrysByDevEui(devEui: string, startDate?: string, endDate?: string): Promise<Telemetry[]> {
    const query: any = { devEui };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);

      query.timestamp = {
        $gte: Math.floor(start.getTime() / 1000),
        $lte: Math.floor(end.getTime() / 1000)
      };

      return this.telemetryModel.find(query).sort({ timestamp: -1, _id: -1 }).exec();
    }

    return this.telemetryModel.find(query).sort({ timestamp: -1, _id: -1 }).limit(50).exec();
  }
}
