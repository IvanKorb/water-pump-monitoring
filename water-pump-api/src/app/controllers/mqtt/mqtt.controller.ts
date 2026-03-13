import { Controller, Get, UseGuards } from '@nestjs/common';
import { MqttService } from 'src/app/services/mqtt/mqtt.service';
import { MqttGateway } from 'src/app/services/mqtt/mqtt.gateway';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('mqtt')
export class MqttController {
  constructor(
    private readonly mqttService: MqttService,
    private readonly mqttGateway: MqttGateway
  ) {}

  @Get('latest-data')
  async getLatestData() {
    const data = await this.mqttService.getLatestData();
    this.mqttGateway.sendMessage(data);
    
    return { success: true, data };
  }
}
