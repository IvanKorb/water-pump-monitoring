import { Schema, Types } from 'mongoose';
export interface Device {
    _id?: Types.ObjectId | string;
    name?: string;
    description?: string;
    devEui: string;
    isPower: boolean;
    timestamp?: number;
    counterPacket?: number;
    rssi?: number;
    snr?: number;
    // Чисто “последняя телеметрия”
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

export const DeviceSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    devEui: { type: String, required: true },
    isPower: { type: Boolean },
    rssi: { type: Number },
    snr: { type: Number },
    timestamp: { type: Number },
    counterPacket: { type: Number },
    // Последняя телеметрия
    outputfrequency: { type: Number },
    setfrequency: { type: Number },
    outputcurrent: { type: Number },
    outputvoltage: { type: Number },

    ch1AphaseVoltage: { type: Number },
    ch1BphaseVoltage: { type: Number },
    ch1CphaseVoltage: { type: Number },
    ch1AphaseCurrent: { type: Number },
    ch1BphaseCurrent: { type: Number },
    ch1CphaseCurrent: { type: Number },

    flowRate: { type: Number },
    velocity: { type: Number },
    positiveAccumulator: { type: Number },
    negativeAccumulator: { type: Number },

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
