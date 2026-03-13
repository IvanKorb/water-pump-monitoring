import { Schema, Document } from 'mongoose';

export interface Telemetry extends Document {
  devEui: string;
  fcnt: number;
  type: string;
  time: string;
  rssi: number;
  snr?: number;
  battery: number;
  timestamp: number;
  status?: string;
  operatorName?: string;
  acceptedAt?: number;
  //telemetry
  //Частотный преобразователь
  outputfrequency?: number; //Выходная частота
  setfrequency?: number; //Заданная частота
  outputcurrent?: number; //Выходной ток
  outputvoltage?: number; //Выходное напряжение
  //Измеритель электроэнергии
  ch1AphaseVoltage?: number; //Напряжение на фазе A
  ch1BphaseVoltage?: number; //Напряжение на фазе B
  ch1CphaseVoltage?: number; //Напряжение на фазе C
  ch1AphaseCurrent?: number; //Ток фазы A
  ch1BphaseCurrent?: number; //Ток фазы B
  ch1CphaseCurrent?: number; //Ток фазы C
  //Ультразвуковой расходомер воды
  flowRate?: number; //Расход
  velocity?: number; //Скорость потока
  positiveAccumulator?: number; //Суммарный прямой расход
  negativeAccumulator?: number; //Суммарный обратный расход
  inverterrunningstatus?: string; //
  running: boolean;             // bit0
  reverse: boolean;             // bit1
  zeroSpeed: boolean;           // bit2
  accelerating: boolean;        // bit4
  decelerating: boolean;        // bit5
  constantSpeed: boolean;       // bit6
  preExcitation: boolean;       // bit7

  autoTuning: boolean;          // bit8
  overcurrentLimit: boolean;    // bit9
  overvoltageLimit: boolean;    // bit10
  torqueLimit: boolean;         // bit11
  speedLimit: boolean;          // bit12
  speedControl: boolean;        // bit13
  torqueControl: boolean;       // bit14
}

export const TelemetrySchema = new Schema({
  devEui: { type: String, required: true },
  fcnt: { type: Number },
  type: { type: String },
  time: { type: String, required: true },
  rssi: { type: Number },
  snr: { type: Number },
  battery: { type: Number },
  timestamp: { type: Number },
  status: { type: String },
  operatorName: { type: String },
  acceptedAt: { type: Number },
  //telemetry
  //Частотный преобразователь
  outputfrequency: { type: Number }, //Выходная частота
  setfrequency: { type: Number }, //Заданная частота
  outputcurrent: { type: Number }, //Выходной ток
  outputvoltage: { type: Number }, //Выходное напряжение
  //Измеритель электроэнергии
  ch1AphaseVoltage: { type: Number }, //Напряжение на фазе A
  ch1BphaseVoltage: { type: Number }, //Напряжение на фазе B
  ch1CphaseVoltage: { type: Number }, //Напряжение на фазе C
  ch1AphaseCurrent: { type: Number }, //Ток фазы A
  ch1BphaseCurrent: { type: Number }, //Ток фазы B
  ch1CphaseCurrent: { type: Number }, //Ток фазы C
  //Ультразвуковой расходомер воды
  inverterrunningstatus: { type: String }, //
  flowRate: { type: Number }, //Расход
  velocity: { type: Number }, //Скорость потока
  positiveAccumulator: { type: Number }, //Суммарный прямой расход
  negativeAccumulator: { type: Number }, //Суммарный обратный расход

  running: { type: Boolean },
  reverse: { type: Boolean },
  zeroSpeed: { type: Boolean },
  accelerating: { type: Boolean },
  decelerating: { type: Boolean },
  constantSpeed: { type: Boolean },
  preExcitation: { type: Boolean },

  autoTuning: { type: Boolean },
  overcurrentLimit: { type: Boolean },
  overvoltageLimit: { type: Boolean },
  torqueLimit: { type: Boolean },
  speedLimit: { type: Boolean },
  speedControl: { type: Boolean },
  torqueControl: { type: Boolean },
});

TelemetrySchema.index({ devEui: 1, timestamp: -1 });