import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly cfg: ConfigService) {
    const secret = cfg.get<string>('JWT_SECRET');

    console.log('============== JwtStrategy INIT ==============');
    console.log('[JwtStrategy] NODE_ENV:', process.env.NODE_ENV ?? '(not set)');
    console.log('[JwtStrategy] CWD:', process.cwd());
    console.log('[JwtStrategy] JWT_SECRET present:', !!secret);
    console.log('==============================================');

    if (!secret) {
      console.error(
        '[JwtStrategy] FATAL: JWT_SECRET is not defined. ' +
        'Проверь .env / .env.prod / NODE_ENV и envFilePath в AppModule.',
      );
      throw new Error('JwtStrategy init failed: JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

  async validate(payload: { login: string }) {
    return { login: payload.login };
  }
}