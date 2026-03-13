import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { MqttGateway } from './mqtt.gateway';
import { DeviceService } from '../device/device.service';

import { ConfigService } from '@nestjs/config';
import { TelemetryService } from '../telemetries/telemetry.service';
import { Telemetry } from 'src/app/schemas/telemetry.schema';

@Injectable()
export class MqttService implements OnModuleInit {
  private client: mqtt.MqttClient;

  private readonly username: string;
  private readonly password: string;
  private readonly host: string;
  private readonly applicationId: string;

  private readonly topicName = 'application/+/device/+/event/up';
  private latestData: { [devEui: string]: any } = {};

  constructor(private cfg: ConfigService, private mqttGateway: MqttGateway, private deviceService: DeviceService, private telemetryService: TelemetryService) {
    this.username = this.cfg.get<string>('MQTT_USER');
    this.password = this.cfg.get<string>('MQTT_PASS');
    this.host = this.cfg.get<string>('MQTT_HOST');
    this.applicationId = this.cfg.get<string>('APPLICATION_ID');
  }

  onModuleInit() {
    //Генерация данных по таймеру
    // setInterval(() => {
    //   this.generateAndProcessStubTelemetry();
    // }, 5000);
   // this.connectToMqttBroker();
  }
  private connectToMqttBroker() {
    const options = {
      username: this.username,
      password: this.password,
      reconnectPeriod: 5000,
      connectTimeout: 60000,
    };
    this.client = mqtt.connect(`mqtt://${this.host}`, options);

    this.client.on('connect', () => {
      this.client.subscribe(this.topicName, (err) => {
        if (err) {
          console.error('Ошибка подписки на топик', err);
        } else {
          console.log(`Подписка на топик: ${this.topicName}`);
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      // console.log(`Получено сообщение ${topic}: ${message.toString()}`);
      try {
        const parsedMessage = JSON.parse(message.toString());
        await this.handleIncomingTelemetry(parsedMessage);


      } catch (error) {
        console.error('Ошибка обработки сообщения:', error);
      }
    });

    this.client.on('error', (error) => {
      console.error('Ошибка MQTT клиента:', error);
      console.log('Повторное подключение к MQTT брокеру...');
      this.client.reconnect();
    });

    this.client.on('close', () => {
      console.log('MQTT соединение закрыто');
    });
  }

  private async handleIncomingTelemetry(raw: any): Promise<void> {
    const telemetry = await this.parseTelemetryData(raw);
    // Если все ключевые поля undefined и статус 0xFFFF — просто игнорим
    if (
      telemetry.inverterrunningstatus === '0xFFFF' &&
      telemetry.outputfrequency === undefined &&
      telemetry.setfrequency === undefined &&
      telemetry.outputcurrent === undefined &&
      telemetry.outputvoltage === undefined &&
      telemetry.ch1AphaseVoltage === undefined &&
      telemetry.flowRate === undefined
    ) {
      //  console.log('[MQTT] Пустой статусный пакет, не сохраняем:', telemetry.devEui);
      return;
    }
    const savedTelemetry = await this.telemetryService.saveTelemetry(telemetry);
    const updatedDevice = await this.deviceService.updateFromTelemetry(telemetry);

    this.latestData[telemetry.devEui] = {
      telemetry: savedTelemetry,
      device: updatedDevice,
    };

    this.mqttGateway.sendTelemetry(telemetry.devEui, {
      telemetry: savedTelemetry,
      device: updatedDevice,
    });
  }

  private async parseTelemetryData(data: any): Promise<Telemetry> {
    // 1) devEui из нескольких возможных мест
    const devEuiRaw =
      data.devEui ||
      data.dev_eui ||
      data.deviceInfo?.devEui;

    if (!devEuiRaw || !data.data) {
      throw new Error('Неверный формат телеметрии: отсутствует devEui или data');
    }

    const devEui = String(devEuiRaw).toUpperCase();

    // 2) время
    const timeStr: string = data.time || new Date().toISOString();
    const timestamp = Math.floor(Date.parse(timeStr));

    // 3) fCnt / rssi / snr
    const fcnt = data.fCnt ?? data.fcnt ?? null;
    const rssi = data.rssi ?? data.rxInfo?.[0]?.rssi ?? null;
    const snr = data.snr ?? data.rxInfo?.[0]?.snr ?? null;

    // 4) payload: hex или base64
    const rawPayload: string = data.data;
    let buf: Buffer;

    if (/^[0-9A-Fa-f]+$/.test(rawPayload) && rawPayload.length % 2 === 0) {
      buf = Buffer.from(rawPayload, 'hex');
    } else {
      buf = Buffer.from(rawPayload, 'base64');
    }

    if (buf.length < 51) {
      throw new Error(`Слишком короткий payload (${buf.length} байт), ожидаем >= 51`);
    }


    let offset = 0;
    offset += 1; // первый служебный байт

    const readUint16Scaled = (scale: number) => {
      const raw = buf.readUInt16BE(offset);
      offset += 2;
      // 0xFFFF — нет данных
      if (raw === 0xFFFF) return undefined;
      return raw * scale;
    };

    const readFloatOrUndefined = () => {
      const v = buf.readFloatBE(offset);
      offset += 4;
      // float32 из 0xFFFFFFFF даёт NaN → undefined
      return Number.isNaN(v) ? undefined : v;
    };

    // 1–2: Выходная частота (uint16, ×0.01)
    const outputfrequency = readUint16Scaled(0.01);

    // 3–4: Заданная частота (uint16, ×0.01)
    const setfrequency = readUint16Scaled(0.01);

    // 5–6: Выходной ток (uint16, ×0.01)
    const outputcurrent = readUint16Scaled(0.1); // 0.1

    // 7–8: Выходное напряжение (uint16, ×0.01)
    const outputvoltage = readUint16Scaled(1); // 1

    // 9–10: статус инвертора (flags, uint16)
    const inverterFlags = buf.readUInt16BE(offset); offset += 2;
    const inverterrunningstatus = '0x' + inverterFlags.toString(16).toUpperCase().padStart(4, '0');

    // Если прибор прислал 0xFFFF — считаем, что статуса нет, флаги не трогаем
    let running: boolean | undefined;
    let reverse: boolean | undefined;
    let zeroSpeed: boolean | undefined;
    let accelerating: boolean | undefined;
    let decelerating: boolean | undefined;
    let constantSpeed: boolean | undefined;
    let preExcitation: boolean | undefined;
    let autoTuning: boolean | undefined;
    let overcurrentLimit: boolean | undefined;
    let overvoltageLimit: boolean | undefined;
    let torqueLimit: boolean | undefined;
    let speedLimit: boolean | undefined;
    let speedControl: boolean | undefined;
    let torqueControl: boolean | undefined;

    if (inverterFlags !== 0xFFFF) {
      running = !!(inverterFlags & (1 << 0));   // Running/stop
      reverse = !!(inverterFlags & (1 << 1));   // Reverse/forward
      zeroSpeed = !!(inverterFlags & (1 << 2));   // 0 speed running
      accelerating = !!(inverterFlags & (1 << 4));   // Accelerating
      decelerating = !!(inverterFlags & (1 << 5));   // Decelerating
      constantSpeed = !!(inverterFlags & (1 << 6));   // Constant speed running
      preExcitation = !!(inverterFlags & (1 << 7));   // Pre-excitation
      autoTuning = !!(inverterFlags & (1 << 8));   // Motor auto-tuning
      overcurrentLimit = !!(inverterFlags & (1 << 9));   // Overcurrent limiting
      overvoltageLimit = !!(inverterFlags & (1 << 10));  // Overvoltage limiting
      torqueLimit = !!(inverterFlags & (1 << 11));  // Torque limiting
      speedLimit = !!(inverterFlags & (1 << 12));  // Speed limiting
      speedControl = !!(inverterFlags & (1 << 13));  // Speed control
      torqueControl = !!(inverterFlags & (1 << 14));  // Torque control
    }

    // дальше идут 10 float32 BE подряд
    const ch1AphaseVoltage = readFloatOrUndefined();
    const ch1BphaseVoltage = readFloatOrUndefined();
    const ch1CphaseVoltage = readFloatOrUndefined();

    const ch1AphaseCurrent = readFloatOrUndefined();
    const ch1BphaseCurrent = readFloatOrUndefined();
    const ch1CphaseCurrent = readFloatOrUndefined();

    const flowRate = readFloatOrUndefined();
    const velocity = readFloatOrUndefined();
    const positiveAccumulator = readFloatOrUndefined();
    const negativeAccumulator = readFloatOrUndefined();

    const telemetry: Partial<Telemetry> = {
      devEui,
      fcnt,
      type: 'uplink',
      time: timeStr,
      timestamp,
      rssi: rssi ?? undefined,
      snr: snr ?? undefined,

      outputfrequency,
      setfrequency,
      outputcurrent,
      outputvoltage,

      ch1AphaseVoltage,
      ch1BphaseVoltage,
      ch1CphaseVoltage,
      ch1AphaseCurrent,
      ch1BphaseCurrent,
      ch1CphaseCurrent,

      flowRate,
      velocity,
      positiveAccumulator,
      negativeAccumulator,

      inverterrunningstatus,

      running,
      reverse,
      zeroSpeed,
      accelerating,
      decelerating,
      constantSpeed,
      preExcitation,
      autoTuning,
      overcurrentLimit,
      overvoltageLimit,
      torqueLimit,
      speedLimit,
      speedControl,
      torqueControl,
    };
    return telemetry as Telemetry;
  }


  async generateAndProcessStubTelemetry(): Promise<void> {
    const devices = await this.deviceService.getDevices();

    if (!devices || devices.length === 0) {
      console.error('[MQTT] No devices found for telemetry generation.');
      return;
    }

    const randomDevice = devices[Math.floor(Math.random() * devices.length)];
    const now = new Date();

    const stubTelemetry = {
      devEui: randomDevice.devEui.toUpperCase(),
      fcnt: Math.floor(Math.random() * 500),
      type: 'stub',
      time: now.toISOString(),
      rssi: Math.floor(Math.random() * (90 - 30 + 1)) - 90, // -90…-30
      timestamp: now.getTime(),
      snr: 5.5,
      data: '12000013880000000000404365904f436cc9574367b50e00000000000000000000000000000000000000000000000000000000',
    };
    //  console.log('[MQTT] Sending stub telemetry for devEui =', stubTelemetry.devEui);
    await this.handleIncomingTelemetry(stubTelemetry);
  }

  getLatestData() {
    return this.latestData;
  }

  private publishDownlink(devEui: string, hexPayload: string, description: string) {
    if (!this.client || !this.client.connected) {
      console.error('[MQTT] Клиент не подключен, не могу отправить команду:', description);
      return;
    }
    const devEuiNorm = devEui.toLowerCase();
    const topic = `application/${this.applicationId}/device/${devEuiNorm}/command/down`;

    // HEX → Base64
    const buffer = Buffer.from(hexPayload, 'hex');
    const base64 = buffer.toString('base64');

    const payload = JSON.stringify({
      devEui: devEuiNorm,
      confirmed: false,
      fPort: 10,
      data: base64
    });

    this.client.publish(topic, payload, { qos: 0 }, err => {
      if (err) {
        console.error('[MQTT] Ошибка отправки комманды:', err);
      } else {
        console.log(`[MQTT] Downlink отправлен (${description}):`, topic, hexPayload);
      }
    });
  }

  /**
   * Команда включения насоса (ПУСК)
   */
  public sendPumpStart(devEui: string) {
    const hex = 'A8010601062000000100';
    this.publishDownlink(devEui, hex, 'ПУСК НАСОСА (START)');
  }

  /**
   * Команда остановки насоса (СТОП)
   */
  public sendPumpStop(devEui: string) {
    const hex = 'A8010601062000000300';
    this.publishDownlink(devEui, hex, 'СТОП НАСОСА (STOP)');
  }

  /**
   * Команда опроса состояния (через 10 секунд)
   * hex 08FF
   */
  public sendStatusPoll(devEui: string) {
    const hex = '08FF';

    console.log('[MQTT] Запланирован STATUS POLL через 10 секунд');

    setTimeout(() => {
      this.publishDownlink(devEui, hex, 'ОПРОС СТАТУСА (08FF)');
    }, 10_000);
  }
}


