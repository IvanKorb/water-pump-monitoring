import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device } from 'src/app/schemas/device.schema';
import { Telemetry } from 'src/app/schemas/telemetry.schema';

@Injectable()
export class TelemetryService {
  constructor(
    @InjectModel('Device') private deviceModel: Model<Device>,
    @InjectModel('Telemetry') private telemetryModel: Model<Telemetry>) { }
  async getPacketCount(devEui: string): Promise<number> {
    const query: any = { devEui };

    const packetCount = await this.telemetryModel.countDocuments(query).exec();
    return packetCount;
  }

  async getTelemetryByDevEui(devEui: string, startDate?: string, endDate?: string): Promise<Telemetry[]> {
    const query: any = { devEui };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error("Invalid date range:", startDate, endDate);
        return this.telemetryModel.find({ devEui }).sort({ timestamp: -1 }).limit(50).exec();
      }

      // 06:00 local day boundary in UTC: Asia/Qyzylorda = UTC+5 => 06:00 local == 01:00 UTC
      start.setUTCHours(1, 0, 0, 0);

      // end = next day 06:00 local => endDate at 06:00 + 1 day
      end.setUTCHours(1, 0, 0, 0);
      end.setUTCDate(end.getUTCDate() + 1);

      query.timestamp = {
        $gte: start.getTime(),
        $lt: end.getTime(), // лучше $lt чем $lte, чтобы границу не дублировать
      };

      return this.telemetryModel.find(query).sort({ timestamp: -1 }).exec();
    }

    return this.telemetryModel.find(query).sort({ timestamp: -1 }).limit(50).exec();
  }

  async getTelemetriesByDevEuiWithBadStatus(devEui: string): Promise<Telemetry[]> {
    const query: any = { devEui };

    query.$or = [
      { input1: true },
      { input2: true }
    ];

    query.status = { $ne: 'Подтверждён' };
    query.$or.push({ status: { $in: [null, ''] } });
    const arr = await this.telemetryModel.find(query).sort({ timestamp: -1 }).exec();
    return arr;
  }

  async getUnconfirmedTelemetries(): Promise<Telemetry[]> {
    return await this.telemetryModel.find({
      status: { $ne: 'Подтверждён' }
    }).exec();
  }

  async saveTelemetry(telemetryData: any): Promise<Telemetry> {
    const newTelemetry = new this.telemetryModel(telemetryData);
    return newTelemetry.save();
  }

  async updateTelemetryStatus(id: string, updateData: any): Promise<Telemetry | null> {
    const existingTelemetry = await this.telemetryModel.findById(id).exec();
    if (!existingTelemetry || existingTelemetry.status === 'Подтверждён') {
      return null;
    }
    const updatedTelemetry = await this.telemetryModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    return updatedTelemetry;
  }

  async confirmAllTelemetriesByDevEui(devEui: string, operatorName: string): Promise<any> {
    const currentTime = Date.now();
    const updatedTelemetrys = await this.telemetryModel.find(
      { devEui, $or: [], status: { $ne: 'Подтверждён' } }
    ).exec();

    if (updatedTelemetrys.length === 0) {
      return null;
    }

    await this.telemetryModel.updateMany(
      { devEui, $or: [], status: { $ne: 'Подтверждён' } },
      {
        $set: {
          status: 'Подтверждён',
          operatorName: operatorName,
          acceptedAt: currentTime,
        },
      },
    ).exec();

    return updatedTelemetrys;
  }
}
