import { Controller, Get, Query, Param, Patch, Body, Post, UseGuards } from '@nestjs/common';
import { Telemetry } from 'src/app/schemas/telemetry.schema';
import { TelemetryService } from 'src/app/services/telemetries/telemetry.service';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('Telemetries')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) { }

  @Get(':devEui')
  async getTelemetriesByDevEui(
    @Param('devEui') devEui: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<Telemetry[]> {
    return this.telemetryService.getTelemetryByDevEui(devEui, startDate, endDate);
  }

  @Patch('updateTelemetryStatus/:id')
  async updateTelemetryStatus(@Param('id') id: string, @Body() updateData: any) {
    return this.telemetryService.updateTelemetryStatus(id, updateData);
  }

  @Post('updateAllTelemetryStatus')
  async confirmAllTelemetrysByDevEui(
    @Body('devEui') devEui: string,
    @Body('operatorName') operatorName: string
  ): Promise<any> {
    return this.telemetryService.confirmAllTelemetriesByDevEui(devEui, operatorName);
  }

  @Get('getPacketCount/:devEui')
  async getPacketCount(@Param('devEui') devEui: string): Promise<{ counterPacket: number }> {
    const counterPacket = await this.telemetryService.getPacketCount(devEui);
    console.log('[TELEMETRY CONTROLLER] getPacketCount:', devEui, counterPacket);
    return { counterPacket };
  }
}
