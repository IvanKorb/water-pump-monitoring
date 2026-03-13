export interface Telemetry {
  _id?: string;
  devEui?: string;
  fcnt?: number;
  type?: string;
  time?: string;
  rssi?: number;
  battery?: number;
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

  //inverterrunningstatus
  inverterrunningstatus?: string; //Статус работы инвертора
  running?: boolean;             // bit0
  reverse?: boolean;             // bit1
  zeroSpeed?: boolean;           // bit2
  accelerating?: boolean;        // bit4
  decelerating?: boolean;        // bit5
  constantSpeed?: boolean;       // bit6
  preExcitation?: boolean;       // bit7

  autoTuning?: boolean;          // bit8
  overcurrentLimit?: boolean;    // bit9
  overvoltageLimit?: boolean;    // bit10
  torqueLimit?: boolean;         // bit11
  speedLimit?: boolean;          // bit12
  speedControl?: boolean;        // bit13
  torqueControl?: boolean;       // bit14
}

