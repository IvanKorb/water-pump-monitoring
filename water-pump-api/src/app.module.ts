import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './app/controllers/auth/auth.controller';
import { AuthService } from './app/services/auth/auth.service';
import { UserSchema } from './app/schemas/user.schema';
import { DeviceSchema } from './app/schemas/device.schema';
import { DeviceController } from './app/controllers/device/device.controller';
import { DeviceService } from './app/services/device/device.service';
import { MqttService } from './app/services/mqtt/mqtt.service';
import { MqttGateway } from './app/services/mqtt/mqtt.gateway';
import { TelemetrySchema } from './app/schemas/telemetry.schema';
import { TelemetryController } from './app/controllers/telemetry/telemetry.controller';

import { UserController } from './app/controllers/user/user.controller';
import { UserService } from './app/services/user/user.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './auth/jwt.strategy';
import * as fs from 'fs';
import * as path from 'path';

import { TelemetryService } from './app/services/telemetries/telemetry.service';




const resolveEnvFilePath = (): string | undefined => {
  const cwd = process.cwd();
  const nodeEnv = process.env.NODE_ENV;

  const candidates: string[] = [];

  if (nodeEnv === 'production') {
    candidates.push('.env.prod');
  }

  candidates.push('.env');

  const found = candidates.find((file) => fs.existsSync(path.join(cwd, file)));

  console.log('================ ENV DEBUG ================');
  console.log('[ENV] CWD:', cwd);
  console.log('[ENV] NODE_ENV:', nodeEnv ?? '(not set)');
  console.log('[ENV] Candidates:', candidates.join(', '));
  console.log('[ENV] Using env file:', found ?? 'none (ENV only)');
  console.log('===========================================');

  return found;
};

const envFilePath = resolveEnvFilePath();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ...(envFilePath ? { envFilePath } : {}),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        uri: cfg.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => {
        const secret = cfg.get<string>('JWT_SECRET');

        console.log('================ JWT DEBUG ================');
        console.log('[JWT] JWT_SECRET present:', !!secret);
        console.log('[JWT] NODE_ENV:', process.env.NODE_ENV ?? '(not set)');
        console.log('[JWT] From env file:', envFilePath ?? '(none)');
        console.log('===========================================');

        if (!secret) {
          // Кладём в лог максимально прямой текст
          console.error('[JWT] FATAL: JWT_SECRET is not defined. Check .env / .env.prod / NODE_ENV.');
          throw new Error('JWT_SECRET is not defined. See logs for details.');
        }

        return {
          secret,
          signOptions: { expiresIn: '365d' },
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema },
    { name: 'Device', schema: DeviceSchema },
    { name: 'Telemetry', schema: TelemetrySchema }]),
  ],
  controllers: [AuthController, DeviceController, TelemetryController, UserController],
  providers: [AuthService, DeviceService, TelemetryService, MqttService, MqttGateway, UserService, JwtStrategy]
})

export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly authService: AuthService) { }

  async onApplicationBootstrap() {
    await this.authService.createDefaultAdmin();
  }
}